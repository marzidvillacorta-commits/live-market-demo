create extension if not exists pgcrypto;

create sequence if not exists order_code_seq start 1;

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists platform_admins (
  email text primary key,
  created_at timestamptz not null default now()
);

create table if not exists stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  primary_color text not null default '#0f766e',
  whatsapp_number text,
  status text not null default 'trial' check (status in ('trial', 'active', 'suspended')),
  plan text not null default 'demo' check (plan in ('demo', 'basic', 'pro')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists store_members (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('platform_admin', 'store_owner', 'store_staff')),
  created_at timestamptz not null default now(),
  unique (store_id, user_id)
);

create table if not exists store_settings (
  store_id uuid primary key references stores(id) on delete cascade,
  store_name text not null,
  logo_url text,
  primary_color text not null default '#0f766e',
  whatsapp_number text,
  welcome_text text,
  support_channel text default 'WhatsApp',
  reservation_minutes integer not null default 60 check (reservation_minutes > 0),
  reserve_stock_on_order boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  name text not null,
  code text not null,
  description text,
  price numeric(12,2) not null check (price >= 0),
  image_url text,
  category text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, code)
);

create table if not exists product_variants (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  option_name text not null check (option_name in ('talla', 'color', 'numero', 'modelo', 'presentacion')),
  option_value text not null,
  second_option_name text,
  second_option_value text,
  stock integer not null default 0 check (stock >= 0),
  price_delta numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists live_state (
  store_id uuid primary key references stores(id) on delete cascade,
  current_product_id uuid references products(id) on delete set null,
  history_product_ids uuid[] not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  order_code text not null unique,
  status text not null default 'nuevo' check (
    status in ('nuevo', 'separado', 'pendiente', 'confirmado', 'pagado', 'preparando', 'enviado', 'cancelado')
  ),
  customer_name text not null,
  phone text not null,
  social_user text,
  city text not null,
  department text,
  province text,
  district text,
  shipping_agency text default 'Shalom',
  shipping_agency_other text,
  agency_office text,
  address_reference text,
  note text,
  total_amount numeric(12,2) not null default 0,
  stock_reserved boolean not null default false,
  stock_released boolean not null default false,
  reservation_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  variant_id uuid references product_variants(id) on delete set null,
  product_code text not null,
  product_name text not null,
  variant_label text,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  line_total numeric(12,2) not null check (line_total >= 0),
  created_at timestamptz not null default now()
);

create index if not exists store_members_user_idx on store_members(user_id);
create index if not exists products_store_code_idx on products(store_id, code);
create index if not exists products_store_active_idx on products(store_id, is_active);
create index if not exists variants_product_idx on product_variants(product_id);
create index if not exists orders_store_status_idx on orders(store_id, status, created_at desc);
create index if not exists order_items_order_idx on order_items(order_id);

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on profiles;
create trigger set_profiles_updated_at before update on profiles for each row execute function set_updated_at();
drop trigger if exists set_stores_updated_at on stores;
create trigger set_stores_updated_at before update on stores for each row execute function set_updated_at();
drop trigger if exists set_store_settings_updated_at on store_settings;
create trigger set_store_settings_updated_at before update on store_settings for each row execute function set_updated_at();
drop trigger if exists set_products_updated_at on products;
create trigger set_products_updated_at before update on products for each row execute function set_updated_at();
drop trigger if exists set_product_variants_updated_at on product_variants;
create trigger set_product_variants_updated_at before update on product_variants for each row execute function set_updated_at();
drop trigger if exists set_orders_updated_at on orders;
create trigger set_orders_updated_at before update on orders for each row execute function set_updated_at();

create or replace function is_platform_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from platform_admins
    where lower(email) = lower(coalesce(auth.jwt()->>'email', ''))
  );
$$;

create or replace function is_store_member(p_store_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from store_members
    where store_id = p_store_id and user_id = auth.uid()
  ) or is_platform_admin();
$$;

create or replace function is_store_owner(p_store_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from store_members
    where store_id = p_store_id
      and user_id = auth.uid()
      and role in ('store_owner', 'platform_admin')
  ) or is_platform_admin();
$$;

create or replace function handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.email))
  on conflict (id) do update
  set email = excluded.email,
      full_name = coalesce(profiles.full_name, excluded.full_name),
      updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_live_market on auth.users;
create trigger on_auth_user_created_live_market
after insert on auth.users
for each row execute function handle_new_user_profile();

create or replace function assign_user_to_store_by_email(p_store_id uuid, p_email text, p_role text default 'store_staff')
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_role text;
begin
  if not is_platform_admin() then
    raise exception 'not_platform_admin';
  end if;

  v_role := coalesce(nullif(p_role, ''), 'store_staff');
  if v_role not in ('store_owner', 'store_staff') then
    raise exception 'invalid_role';
  end if;

  select id into v_user_id from profiles where lower(email) = lower(trim(p_email)) limit 1;
  if v_user_id is null then
    return 'Primero crea este usuario en Supabase Auth. Luego vuelve a asignarlo a la tienda.';
  end if;

  insert into store_members (store_id, user_id, role)
  values (p_store_id, v_user_id, v_role)
  on conflict (store_id, user_id) do update set role = excluded.role;

  return 'Usuario asignado correctamente a la tienda.';
end;
$$;

create or replace function create_public_order(p_store_id uuid, p_customer jsonb, p_items jsonb)
returns table(order_id uuid, order_code text, total_amount numeric)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_store stores%rowtype;
  v_settings store_settings%rowtype;
  v_order_id uuid;
  v_order_code text;
  v_total numeric(12,2) := 0;
  v_item jsonb;
  v_product products%rowtype;
  v_variant product_variants%rowtype;
  v_variant_count integer;
  v_product_id uuid;
  v_variant_id uuid;
  v_qty integer;
  v_unit_price numeric(12,2);
  v_variant_label text;
begin
  select * into v_store from stores where id = p_store_id and status = 'active';
  if not found then raise exception 'store_unavailable'; end if;

  select * into v_settings from store_settings where store_id = p_store_id;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'empty_order';
  end if;

  if coalesce(trim(p_customer->>'customer_name'), '') = ''
    or coalesce(trim(p_customer->>'phone'), '') = ''
    or coalesce(trim(p_customer->>'department'), '') = ''
    or coalesce(trim(p_customer->>'province'), '') = ''
    or coalesce(trim(p_customer->>'district'), '') = ''
  then
    raise exception 'customer_required';
  end if;

  v_order_code := 'LM-' || lpad(nextval('order_code_seq')::text, 6, '0');

  insert into orders (
    store_id, order_code, customer_name, phone, social_user, city, department, province, district,
    shipping_agency, shipping_agency_other, agency_office, address_reference, note,
    stock_reserved, reservation_expires_at
  )
  values (
    p_store_id,
    v_order_code,
    trim(p_customer->>'customer_name'),
    trim(p_customer->>'phone'),
    nullif(trim(coalesce(p_customer->>'social_user', '')), ''),
    concat_ws(', ', p_customer->>'district', p_customer->>'province', p_customer->>'department'),
    nullif(trim(coalesce(p_customer->>'department', '')), ''),
    nullif(trim(coalesce(p_customer->>'province', '')), ''),
    nullif(trim(coalesce(p_customer->>'district', '')), ''),
    coalesce(nullif(trim(coalesce(p_customer->>'shipping_agency', '')), ''), 'Shalom'),
    nullif(trim(coalesce(p_customer->>'shipping_agency_other', '')), ''),
    nullif(trim(coalesce(p_customer->>'agency_office', '')), ''),
    nullif(trim(coalesce(p_customer->>'address_reference', '')), ''),
    nullif(trim(coalesce(p_customer->>'note', '')), ''),
    coalesce(v_settings.reserve_stock_on_order, true),
    case when coalesce(v_settings.reserve_stock_on_order, true)
      then now() + make_interval(mins => coalesce(v_settings.reservation_minutes, 60))
      else null end
  )
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_product_id := (v_item->>'product_id')::uuid;
    v_variant_id := nullif(v_item->>'variant_id', '')::uuid;
    v_qty := greatest(coalesce((v_item->>'quantity')::integer, 1), 1);
    v_variant_label := null;

    select * into v_product
    from products
    where id = v_product_id and store_id = p_store_id and is_active = true;
    if not found then raise exception 'product_unavailable'; end if;

    select count(*) into v_variant_count from product_variants where product_id = v_product.id and store_id = p_store_id;
    if v_variant_count > 0 and v_variant_id is null then raise exception 'variant_required'; end if;

    if v_variant_id is not null then
      select * into v_variant
      from product_variants
      where id = v_variant_id and product_id = v_product.id and store_id = p_store_id
      for update;
      if not found then raise exception 'variant_unavailable'; end if;
      if coalesce(v_settings.reserve_stock_on_order, true) and v_variant.stock < v_qty then
        raise exception 'insufficient_stock';
      end if;
      v_unit_price := v_product.price + v_variant.price_delta;
      v_variant_label := initcap(v_variant.option_name) || ': ' || v_variant.option_value;
      if v_variant.second_option_name is not null and v_variant.second_option_value is not null then
        v_variant_label := v_variant_label || ' / ' || v_variant.second_option_name || ': ' || v_variant.second_option_value;
      end if;
      if coalesce(v_settings.reserve_stock_on_order, true) then
        update product_variants set stock = stock - v_qty where id = v_variant.id and store_id = p_store_id;
      end if;
    else
      v_unit_price := v_product.price;
    end if;

    insert into order_items (
      store_id, order_id, product_id, variant_id, product_code, product_name, variant_label,
      quantity, unit_price, line_total
    )
    values (
      p_store_id, v_order_id, v_product.id, v_variant_id, v_product.code, v_product.name, v_variant_label,
      v_qty, v_unit_price, v_unit_price * v_qty
    );
    v_total := v_total + (v_unit_price * v_qty);
  end loop;

  update orders set total_amount = v_total where id = v_order_id;
  return query select v_order_id, v_order_code, v_total;
exception
  when others then
    if v_order_id is not null then delete from orders where id = v_order_id; end if;
    raise;
end;
$$;

alter table profiles enable row level security;
alter table platform_admins enable row level security;
alter table stores enable row level security;
alter table store_members enable row level security;
alter table store_settings enable row level security;
alter table products enable row level security;
alter table product_variants enable row level security;
alter table live_state enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

create policy "profiles own row" on profiles for all to authenticated
using (id = auth.uid() or is_platform_admin()) with check (id = auth.uid() or is_platform_admin());

create policy "platform admins read" on platform_admins for select to authenticated using (is_platform_admin());
create policy "platform admins manage" on platform_admins for all to authenticated using (is_platform_admin()) with check (is_platform_admin());

create policy "stores read public or member" on stores for select
using ((auth.role() = 'anon' and status = 'active') or is_store_member(id));
create policy "platform creates stores" on stores for insert to authenticated with check (is_platform_admin());
create policy "owners update stores" on stores for update to authenticated using (is_store_owner(id)) with check (is_store_owner(id));

create policy "memberships read" on store_members for select to authenticated
using (user_id = auth.uid() or is_store_owner(store_id));
create policy "owners manage memberships" on store_members for all to authenticated
using (is_store_owner(store_id)) with check (is_store_owner(store_id));

create policy "settings read public or member" on store_settings for select
using ((auth.role() = 'anon' and exists (select 1 from stores s where s.id = store_id and s.status = 'active')) or is_store_member(store_id));
create policy "owners manage settings" on store_settings for all to authenticated
using (is_store_owner(store_id)) with check (is_store_owner(store_id));

create policy "products read public or member" on products for select
using ((auth.role() = 'anon' and is_active and exists (select 1 from stores s where s.id = store_id and s.status = 'active')) or is_store_member(store_id));
create policy "owners manage products" on products for all to authenticated
using (is_store_owner(store_id)) with check (is_store_owner(store_id));

create policy "variants read public or member" on product_variants for select
using (
  (auth.role() = 'anon' and exists (
    select 1 from products p join stores s on s.id = p.store_id
    where p.id = product_id and p.store_id = product_variants.store_id and p.is_active and s.status = 'active'
  ))
  or is_store_member(store_id)
);
create policy "owners manage variants" on product_variants for all to authenticated
using (is_store_owner(store_id)) with check (is_store_owner(store_id));

create policy "live read public or member" on live_state for select
using ((auth.role() = 'anon' and exists (select 1 from stores s where s.id = store_id and s.status = 'active')) or is_store_member(store_id));
create policy "owners manage live" on live_state for all to authenticated
using (is_store_owner(store_id)) with check (is_store_owner(store_id));

create policy "members read orders" on orders for select to authenticated using (is_store_member(store_id));
create policy "members update orders" on orders for update to authenticated using (is_store_member(store_id)) with check (is_store_member(store_id));
create policy "members read order items" on order_items for select to authenticated using (is_store_member(store_id));

grant usage on schema public to anon, authenticated;
grant select on stores, store_settings, products, product_variants, live_state to anon, authenticated;
grant select, insert, update, delete on profiles, stores, store_members, store_settings, products, product_variants, live_state, orders, order_items to authenticated;
grant execute on function create_public_order(uuid, jsonb, jsonb) to anon, authenticated;
grant execute on function assign_user_to_store_by_email(uuid, text, text) to authenticated;
grant usage, select on sequence order_code_seq to anon, authenticated;

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

drop policy if exists "members upload product images" on storage.objects;
create policy "members upload product images" on storage.objects for insert to authenticated
with check (bucket_id = 'product-images');
drop policy if exists "public read product images" on storage.objects;
create policy "public read product images" on storage.objects for select
using (bucket_id = 'product-images');

do $$
begin
  alter publication supabase_realtime add table live_state;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table orders;
exception when duplicate_object then null;
end $$;

insert into platform_admins (email) values ('demo@livemarket.pe') on conflict do nothing;

insert into stores (name, slug, primary_color, whatsapp_number, status, plan)
values
  ('Urban Style', 'urbanstyle', '#0f766e', '51925035273', 'active', 'demo'),
  ('Zapas VIP', 'zapasvip', '#be123c', '51925035273', 'active', 'demo')
on conflict (slug) do update
set name = excluded.name,
    primary_color = excluded.primary_color,
    whatsapp_number = excluded.whatsapp_number,
    status = excluded.status,
    plan = excluded.plan;

insert into store_settings (store_id, store_name, primary_color, whatsapp_number, welcome_text)
select
  id,
  name,
  primary_color,
  whatsapp_number,
  case when slug = 'urbanstyle' then 'Busca el codigo del live y separa tu prenda favorita.'
       else 'Encuentra tu par por codigo y pidelo en segundos.' end
from stores
where slug in ('urbanstyle', 'zapasvip')
on conflict (store_id) do update
set store_name = excluded.store_name,
    primary_color = excluded.primary_color,
    whatsapp_number = excluded.whatsapp_number,
    welcome_text = excluded.welcome_text;

with s as (select id, slug from stores where slug in ('urbanstyle', 'zapasvip'))
insert into products (store_id, code, name, description, price, image_url, category, is_active)
select s.id, p.code, p.name, p.description, p.price, p.image_url, p.category, true
from s
join (
  values
    ('urbanstyle','URB101','Polo oversize negro','Algodon premium, corte amplio.',49.90,'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80','Ropa'),
    ('urbanstyle','URB202','Jogger cargo arena','Jogger urbano con bolsillos laterales.',89.90,'https://images.unsplash.com/photo-1506629905607-d405b7a30db9?auto=format&fit=crop&w=900&q=80','Ropa'),
    ('urbanstyle','URB303','Casaca denim clara','Casaca ligera para live shopping.',119.90,'https://images.unsplash.com/photo-1543076447-215ad9ba6923?auto=format&fit=crop&w=900&q=80','Ropa'),
    ('zapasvip','ZP104','Zapatilla urbana blanca','Modelo comodo para uso diario.',129.90,'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=900&q=80','Zapatillas'),
    ('zapasvip','ZP205','Runner negro premium','Suela alta, plantilla suave.',159.90,'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=900&q=80','Zapatillas'),
    ('zapasvip','ZP306','Sneaker beige street','Sneaker casual para outfits urbanos.',139.90,'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=900&q=80','Zapatillas')
) as p(slug, code, name, description, price, image_url, category) on p.slug = s.slug
on conflict (store_id, code) do update
set name = excluded.name, description = excluded.description, price = excluded.price, image_url = excluded.image_url, category = excluded.category, is_active = true;

with p as (select id, store_id, code from products)
insert into product_variants (store_id, product_id, option_name, option_value, second_option_name, second_option_value, stock)
select p.store_id, p.id, v.option_name, v.option_value, v.second_option_name, v.second_option_value, v.stock
from p
join (
  values
    ('URB101','talla','S','Color','Negro',8),('URB101','talla','M','Color','Arena',9),('URB101','talla','L','Color','Arena',10),
    ('URB202','talla','S','Color','Arena',6),('URB202','talla','M','Color','Arena',8),('URB202','talla','L','Color','Arena',5),
    ('URB303','talla','M','Color','Celeste',5),('URB303','talla','L','Color','Celeste',5),
    ('ZP104','numero','38',null,null,8),('ZP104','numero','39',null,null,10),('ZP104','numero','40',null,null,9),('ZP104','numero','41',null,null,6),
    ('ZP205','numero','39',null,null,5),('ZP205','numero','40',null,null,7),('ZP205','numero','41',null,null,5),
    ('ZP306','numero','38',null,null,4),('ZP306','numero','39',null,null,6),('ZP306','numero','40',null,null,6)
) as v(code, option_name, option_value, second_option_name, second_option_value, stock) on v.code = p.code
where not exists (
  select 1 from product_variants existing
  where existing.product_id = p.id and existing.option_name = v.option_name and existing.option_value = v.option_value
);

insert into live_state (store_id, current_product_id, history_product_ids)
select s.id, p.id, array[p.id]::uuid[]
from stores s join products p on p.store_id = s.id
where (s.slug = 'urbanstyle' and p.code = 'URB101') or (s.slug = 'zapasvip' and p.code = 'ZP104')
on conflict (store_id) do update
set current_product_id = excluded.current_product_id,
    history_product_ids = excluded.history_product_ids,
    updated_at = now();
