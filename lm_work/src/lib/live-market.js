"use client";

import { createClient } from "@supabase/supabase-js";

export const DEMO_EMAIL = "demo@livemarket.pe";
export const DEMO_PASSWORD = "123456";
export const STORAGE_BUCKET = "product-images";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured =
  SUPABASE_URL.startsWith("https://") &&
  SUPABASE_ANON_KEY.length > 40 &&
  !SUPABASE_URL.includes("TU_PROYECTO");

export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null;

export const variantLabels = {
  talla: "Talla",
  color: "Color",
  numero: "Numero",
  modelo: "Modelo",
  presentacion: "Presentacion",
};

const demoKey = "live_market_demo_v1";
const demoSessionKey = "live_market_demo_session_v1";

export function money(value) {
  return new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(Number(value || 0));
}

export function cleanSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function variantName(variant) {
  if (!variant) return "Producto";
  const first = `${variantLabels[variant.option_name] || variant.option_name}: ${variant.option_value}`;
  const second =
    variant.second_option_name && variant.second_option_value
      ? ` / ${variant.second_option_name}: ${variant.second_option_value}`
      : "";
  return `${first}${second}`;
}

export function friendlyError() {
  return "No pudimos completar la accion. Intentalo nuevamente.";
}

function now() {
  return new Date().toISOString();
}

function uid(prefix) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(36)}`;
}

function productImage(seed) {
  const encoded = encodeURIComponent(seed);
  return `https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80&sig=${encoded}`;
}

function initialDemoDb() {
  const created = now();
  const stores = [
    {
      id: "store_urbanstyle",
      name: "Urban Style",
      slug: "urbanstyle",
      logo_url: "",
      primary_color: "#0f766e",
      whatsapp_number: "51925035273",
      status: "active",
      plan: "demo",
      created_at: created,
    },
    {
      id: "store_zapasvip",
      name: "Zapas VIP",
      slug: "zapasvip",
      logo_url: "",
      primary_color: "#be123c",
      whatsapp_number: "51925035273",
      status: "active",
      plan: "demo",
      created_at: created,
    },
  ];

  const products = [
    ["prod_urb101", "store_urbanstyle", "URB101", "Polo oversize negro", "Algodon premium, corte amplio.", 49.9, "Ropa", productImage("polo")],
    ["prod_urb202", "store_urbanstyle", "URB202", "Jogger cargo arena", "Jogger urbano con bolsillos laterales.", 89.9, "Ropa", productImage("jogger")],
    ["prod_urb303", "store_urbanstyle", "URB303", "Casaca denim clara", "Casaca ligera para live shopping.", 119.9, "Ropa", productImage("denim")],
    ["prod_zp104", "store_zapasvip", "ZP104", "Zapatilla urbana blanca", "Modelo comodo para uso diario.", 129.9, "Zapatillas", "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=900&q=80"],
    ["prod_zp205", "store_zapasvip", "ZP205", "Runner negro premium", "Suela alta, plantilla suave.", 159.9, "Zapatillas", "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=900&q=80"],
    ["prod_zp306", "store_zapasvip", "ZP306", "Sneaker beige street", "Sneaker casual para outfits urbanos.", 139.9, "Zapatillas", "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=900&q=80"],
  ].map(([id, store_id, code, name, description, price, category, image_url]) => ({
    id,
    store_id,
    code,
    name,
    description,
    price,
    category,
    image_url,
    is_active: true,
    created_at: created,
  }));

  const productByCode = Object.fromEntries(products.map((product) => [product.code, product]));
  const variants = [];
  [
    ["URB101", "talla", ["S", "M", "L"]],
    ["URB202", "talla", ["S", "M", "L"]],
    ["URB303", "talla", ["M", "L"]],
    ["ZP104", "numero", ["38", "39", "40", "41"]],
    ["ZP205", "numero", ["39", "40", "41"]],
    ["ZP306", "numero", ["38", "39", "40"]],
  ].forEach(([code, option, values]) => {
    values.forEach((value, index) => {
      const product = productByCode[code];
      variants.push({
        id: `var_${code}_${value}`,
        store_id: product.store_id,
        product_id: product.id,
        option_name: option,
        option_value: value,
        second_option_name: option === "talla" ? "Color" : null,
        second_option_value: option === "talla" ? (index === 0 ? "Negro" : "Arena") : null,
        stock: 6 + index,
        price_delta: 0,
        created_at: created,
      });
    });
  });

  return {
    seq: 1,
    profiles: [{ id: "user_demo", email: DEMO_EMAIL, full_name: "Demo Live Market", role: "platform_admin" }],
    platform_admins: [{ email: DEMO_EMAIL }],
    stores,
    store_settings: stores.map((store) => ({
      store_id: store.id,
      store_name: store.name,
      logo_url: store.logo_url,
      primary_color: store.primary_color,
      whatsapp_number: store.whatsapp_number,
      welcome_text:
        store.slug === "urbanstyle"
          ? "Busca el codigo del live y separa tu prenda favorita."
          : "Encuentra tu par por codigo y pidelo en segundos.",
      support_channel: "WhatsApp",
      reservation_minutes: 60,
      reserve_stock_on_order: true,
    })),
    store_members: stores.map((store) => ({
      id: `member_${store.slug}`,
      store_id: store.id,
      user_id: "user_demo",
      role: "store_owner",
      created_at: created,
    })),
    products,
    product_variants: variants,
    live_state: [
      { store_id: "store_urbanstyle", current_product_id: "prod_urb101", history_product_ids: ["prod_urb101", "prod_urb202"], updated_at: created },
      { store_id: "store_zapasvip", current_product_id: "prod_zp104", history_product_ids: ["prod_zp104", "prod_zp205"], updated_at: created },
    ],
    orders: [],
    order_items: [],
  };
}

function readDemoDb() {
  if (typeof window === "undefined") return initialDemoDb();
  try {
    const raw = localStorage.getItem(demoKey);
    return raw ? JSON.parse(raw) : writeDemoDb(initialDemoDb());
  } catch {
    return writeDemoDb(initialDemoDb());
  }
}

function writeDemoDb(db) {
  if (typeof window !== "undefined") localStorage.setItem(demoKey, JSON.stringify(db));
  return db;
}

function demoSession() {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem(demoSessionKey) || "null");
  } catch {
    return null;
  }
}

function storeSession(session) {
  if (typeof window === "undefined") return;
  if (session) localStorage.setItem(demoSessionKey, JSON.stringify(session));
  else localStorage.removeItem(demoSessionKey);
  window.dispatchEvent(new Event("live-market-auth"));
}

function hydrateStore(db, store) {
  if (!store) return null;
  const settings = db.store_settings.find((item) => item.store_id === store.id) || {};
  return { ...store, store_settings: settings, whatsapp_number: settings.whatsapp_number || store.whatsapp_number };
}

export async function getSession() {
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    return data.session;
  }
  return demoSession();
}

export async function signIn(email, password) {
  if (supabase) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return;
  }
  if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
    storeSession({ user: { id: "user_demo", email } });
    return;
  }
  throw new Error("invalid_credentials");
}

export async function signOut() {
  if (supabase) return supabase.auth.signOut();
  storeSession(null);
}

export async function getPublicStore(slug) {
  if (supabase) {
    const { data, error } = await supabase
      .from("stores")
      .select("*, store_settings(*)")
      .eq("slug", slug)
      .eq("status", "active")
      .maybeSingle();
    if (error) throw error;
    return data ? { ...data, store_settings: Array.isArray(data.store_settings) ? data.store_settings[0] : data.store_settings } : null;
  }
  const db = readDemoDb();
  return hydrateStore(db, db.stores.find((store) => store.slug === slug && store.status === "active"));
}

export async function getMemberStores() {
  const session = await getSession();
  if (!session) return [];
  if (supabase) {
    const { data, error } = await supabase
      .from("store_members")
      .select("role, stores(*, store_settings(*))")
      .eq("user_id", session.user.id)
      .order("created_at");
    if (error) throw error;
    return (data || [])
      .map((row) => {
        const store = row.stores;
        return store
          ? {
              ...store,
              member_role: row.role,
              store_settings: Array.isArray(store.store_settings) ? store.store_settings[0] : store.store_settings,
            }
          : null;
      })
      .filter(Boolean);
  }
  const db = readDemoDb();
  const memberships = db.store_members.filter((member) => member.user_id === session.user.id);
  return memberships
    .map((member) => hydrateStore(db, db.stores.find((store) => store.id === member.store_id)))
    .filter(Boolean);
}

export async function getAdminStores() {
  const session = await getSession();
  if (!session) return [];
  if (supabase) {
    const isPlatform = await isPlatformAdmin();
    if (isPlatform) {
      const { data, error } = await supabase.from("stores").select("*, store_settings(*)").order("created_at");
      if (error) throw error;
      return (data || []).map((store) => ({
        ...store,
        store_settings: Array.isArray(store.store_settings) ? store.store_settings[0] : store.store_settings,
      }));
    }
    return getMemberStores();
  }
  if (await isPlatformAdmin()) {
    const db = readDemoDb();
    return db.stores.map((store) => hydrateStore(db, store));
  }
  return getMemberStores();
}

export async function isPlatformAdmin() {
  const session = await getSession();
  if (!session) return false;
  if (supabase) {
    const { data } = await supabase.from("platform_admins").select("email").eq("email", session.user.email).maybeSingle();
    return Boolean(data);
  }
  const db = readDemoDb();
  return db.platform_admins.some((admin) => admin.email === session.user.email);
}

export async function listProducts(storeId, includeInactive = true) {
  if (supabase) {
    let query = supabase
      .from("products")
      .select("*, product_variants(*)")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });
    if (!includeInactive) query = query.eq("is_active", true);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }
  const db = readDemoDb();
  return db.products
    .filter((product) => product.store_id === storeId && (includeInactive || product.is_active))
    .map((product) => ({ ...product, product_variants: db.product_variants.filter((variant) => variant.product_id === product.id) }))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function searchProduct(storeId, code) {
  const normalized = String(code || "").trim().toUpperCase();
  const products = await listProducts(storeId, false);
  return products.find((product) => product.code === normalized) || null;
}

export async function saveProduct(storeId, payload) {
  if (supabase) {
    let imageUrl = payload.image_url || null;
    if (payload.image_file) {
      const fileName = `${storeId}/${Date.now()}-${payload.image_file.name}`;
      const upload = await supabase.storage.from(STORAGE_BUCKET).upload(fileName, payload.image_file, { upsert: true });
      if (!upload.error) imageUrl = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(fileName).data.publicUrl;
    }
    const row = {
      store_id: storeId,
      name: payload.name,
      code: String(payload.code).trim().toUpperCase(),
      description: payload.description || "",
      price: Number(payload.price || 0),
      category: payload.category || "",
      image_url: imageUrl,
      is_active: payload.is_active !== false,
    };
    const result = payload.id
      ? await supabase.from("products").update(row).eq("id", payload.id).eq("store_id", storeId)
      : await supabase.from("products").insert(row);
    if (result.error) throw result.error;
    return;
  }
  const db = readDemoDb();
  const row = {
    id: payload.id || uid("prod"),
    store_id: storeId,
    name: payload.name,
    code: String(payload.code).trim().toUpperCase(),
    description: payload.description || "",
    price: Number(payload.price || 0),
    category: payload.category || "",
    image_url: payload.image_url || "",
    is_active: payload.is_active !== false,
    created_at: payload.id ? db.products.find((item) => item.id === payload.id)?.created_at || now() : now(),
  };
  const index = db.products.findIndex((product) => product.id === row.id);
  if (index >= 0) db.products[index] = { ...db.products[index], ...row };
  else db.products.unshift(row);
  writeDemoDb(db);
}

export async function saveVariant(storeId, payload) {
  const row = {
    store_id: storeId,
    product_id: payload.product_id,
    option_name: payload.option_name,
    option_value: payload.option_value,
    second_option_name: payload.second_option_name || null,
    second_option_value: payload.second_option_value || null,
    stock: Number(payload.stock || 0),
    price_delta: Number(payload.price_delta || 0),
  };
  if (supabase) {
    const result = payload.id
      ? await supabase.from("product_variants").update(row).eq("id", payload.id).eq("store_id", storeId)
      : await supabase.from("product_variants").insert(row);
    if (result.error) throw result.error;
    return;
  }
  const db = readDemoDb();
  const full = { id: payload.id || uid("var"), ...row, created_at: now() };
  const index = db.product_variants.findIndex((variant) => variant.id === full.id);
  if (index >= 0) db.product_variants[index] = { ...db.product_variants[index], ...full };
  else db.product_variants.push(full);
  writeDemoDb(db);
}

export async function getLiveState(storeId) {
  if (supabase) {
    const { data, error } = await supabase
      .from("live_state")
      .select("*, current_product:products!live_state_current_product_id_fkey(*)")
      .eq("store_id", storeId)
      .maybeSingle();
    if (error) throw error;
    return data;
  }
  const db = readDemoDb();
  const live = db.live_state.find((item) => item.store_id === storeId);
  if (!live) return null;
  return { ...live, current_product: db.products.find((product) => product.id === live.current_product_id) || null };
}

export async function setLiveProduct(storeId, productId) {
  if (supabase) {
    const current = await getLiveState(storeId);
    const history = [productId, ...(current?.history_product_ids || []).filter((id) => id !== productId)].slice(0, 12);
    const { error } = await supabase
      .from("live_state")
      .upsert({ store_id: storeId, current_product_id: productId, history_product_ids: history, updated_at: now() }, { onConflict: "store_id" });
    if (error) throw error;
    return;
  }
  const db = readDemoDb();
  const current = db.live_state.find((item) => item.store_id === storeId);
  const history = [productId, ...(current?.history_product_ids || []).filter((id) => id !== productId)].slice(0, 12);
  if (current) Object.assign(current, { current_product_id: productId, history_product_ids: history, updated_at: now() });
  else db.live_state.push({ store_id: storeId, current_product_id: productId, history_product_ids: history, updated_at: now() });
  writeDemoDb(db);
}

export async function listOrders(storeId) {
  if (supabase) {
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }
  const db = readDemoDb();
  return db.orders
    .filter((order) => order.store_id === storeId)
    .map((order) => ({ ...order, order_items: db.order_items.filter((item) => item.order_id === order.id) }))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function updateOrderStatus(storeId, orderId, status) {
  if (supabase) {
    const { error } = await supabase.from("orders").update({ status }).eq("id", orderId).eq("store_id", storeId);
    if (error) throw error;
    return;
  }
  const db = readDemoDb();
  const order = db.orders.find((item) => item.id === orderId && item.store_id === storeId);
  if (order) order.status = status;
  writeDemoDb(db);
}

export async function createOrder(store, customer, cart) {
  const items = cart.map((item) => ({ product_id: item.product_id, variant_id: item.variant_id, quantity: item.quantity }));
  if (supabase) {
    const { data, error } = await supabase.rpc("create_public_order", {
      p_store_id: store.id,
      p_customer: customer,
      p_items: items,
    });
    if (error) throw error;
    return Array.isArray(data) ? data[0] : data;
  }
  const db = readDemoDb();
  const orderId = uid("ord");
  const orderCode = `LM-${String(db.seq++).padStart(6, "0")}`;
  let total = 0;
  const orderItems = [];
  for (const item of cart) {
    const product = db.products.find((row) => row.id === item.product_id && row.store_id === store.id);
    const variant = item.variant_id ? db.product_variants.find((row) => row.id === item.variant_id) : null;
    const unit = Number(product.price || 0) + Number(variant?.price_delta || 0);
    const qty = Number(item.quantity || 1);
    total += unit * qty;
    if (variant) variant.stock = Math.max(0, Number(variant.stock || 0) - qty);
    orderItems.push({
      id: uid("item"),
      store_id: store.id,
      order_id: orderId,
      product_id: product.id,
      variant_id: variant?.id || null,
      product_code: product.code,
      product_name: product.name,
      variant_label: variant ? variantName(variant) : "",
      quantity: qty,
      unit_price: unit,
      line_total: unit * qty,
    });
  }
  db.orders.unshift({
    id: orderId,
    store_id: store.id,
    order_code: orderCode,
    status: "nuevo",
    customer_name: customer.customer_name,
    customer_dni: customer.customer_dni || "",
    social_user: customer.social_user || "",
    phone: customer.phone,
    city: [customer.district, customer.province, customer.department].filter(Boolean).join(", "),
    department: customer.department,
    province: customer.province,
    district: customer.district,
    shipping_agency: customer.shipping_agency || "Shalom",
    shipping_agency_other: customer.shipping_agency_other || "",
    agency_office: customer.agency_office || "",
    address_reference: customer.address_reference || "",
    note: customer.note || "",
    total_amount: total,
    created_at: now(),
  });
  db.order_items.push(...orderItems);
  writeDemoDb(db);
  return { order_id: orderId, order_code: orderCode, total_amount: total };
}

export function buildWhatsAppMessage(orderCode, customer, cart, total) {
  const agency = customer.shipping_agency === "Otra" && customer.shipping_agency_other ? customer.shipping_agency_other : customer.shipping_agency || "Shalom";
  return [
    `Hola, quiero confirmar mi cotizacion ${orderCode}.`,
    "",
    "Resumen:",
    ...cart.map((item) => `- ${item.quantity}x ${item.code} ${item.name}${item.variant_name ? ` (${item.variant_name})` : ""} = ${money(item.unit_price * item.quantity)}`),
    "",
    `Total: ${money(total)}`,
    "",
    "Datos de envio:",
    `Nombres completos: ${customer.customer_name}`,
    customer.customer_dni ? `DNI: ${customer.customer_dni}` : null,
    `Celular: ${customer.phone}`,
    customer.social_user ? `Usuario/red social: ${customer.social_user}` : null,
    `Departamento: ${customer.department}`,
    `Provincia: ${customer.province}`,
    `Distrito: ${customer.district}`,
    `Agencia: ${agency}`,
    `Oficina destino: ${customer.agency_office}`,
    customer.address_reference ? `Referencia: ${customer.address_reference}` : null,
    customer.note ? `Nota: ${customer.note}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildLabel(store, order) {
  const agency = order.shipping_agency_other || order.shipping_agency || "Shalom";
  return [
    `TIENDA: ${store.name}`,
    `PEDIDO: ${order.order_code}`,
    `FECHA: ${order.created_at ? new Date(order.created_at).toLocaleDateString("es-PE") : ""}`,
    "",
    "DESTINATARIO:",
    `Nombres completos: ${order.customer_name || ""}`,
    order.customer_dni ? `DNI: ${order.customer_dni}` : null,
    `Celular: ${order.phone || ""}`,
    "",
    "ENVIO:",
    `Agencia: ${agency}`,
    `Oficina destino: ${order.agency_office || ""}`,
    `Departamento: ${order.department || ""}`,
    `Provincia: ${order.province || ""}`,
    `Distrito: ${order.district || ""}`,
    order.address_reference ? `Referencia: ${order.address_reference}` : null,
    order.note ? `Nota: ${order.note}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

export async function saveStore(payload) {
  const row = {
    name: payload.name,
    slug: cleanSlug(payload.slug || payload.name),
    logo_url: payload.logo_url || null,
    primary_color: payload.primary_color || "#0f766e",
    whatsapp_number: String(payload.whatsapp_number || "").replace(/\D/g, ""),
    status: payload.status || "trial",
    plan: payload.plan || "demo",
  };
  if (supabase) {
    const result = payload.id
      ? await supabase.from("stores").update(row).eq("id", payload.id)
      : await supabase.from("stores").insert(row).select().single();
    if (result.error) throw result.error;
    const storeId = payload.id || result.data.id;
    const settings = {
      store_id: storeId,
      store_name: row.name,
      logo_url: row.logo_url,
      primary_color: row.primary_color,
      whatsapp_number: row.whatsapp_number,
      welcome_text: "Busca el codigo del live y envia tu cotizacion por WhatsApp.",
      support_channel: "WhatsApp",
      reservation_minutes: 60,
      reserve_stock_on_order: true,
    };
    const settingsResult = await supabase.from("store_settings").upsert(settings, { onConflict: "store_id" });
    if (settingsResult.error) throw settingsResult.error;
    return storeId;
  }
  const db = readDemoDb();
  const full = { id: payload.id || uid("store"), ...row, created_at: payload.id ? payload.created_at || now() : now() };
  const index = db.stores.findIndex((store) => store.id === full.id);
  if (index >= 0) db.stores[index] = { ...db.stores[index], ...full };
  else {
    db.stores.unshift(full);
    db.live_state.push({ store_id: full.id, current_product_id: null, history_product_ids: [], updated_at: now() });
  }
  const settings = db.store_settings.find((item) => item.store_id === full.id);
  const nextSettings = {
    store_id: full.id,
    store_name: full.name,
    logo_url: full.logo_url,
    primary_color: full.primary_color,
    whatsapp_number: full.whatsapp_number,
    welcome_text: "Busca el codigo del live y envia tu cotizacion por WhatsApp.",
    support_channel: "WhatsApp",
    reservation_minutes: 60,
    reserve_stock_on_order: true,
  };
  if (settings) Object.assign(settings, nextSettings);
  else db.store_settings.push(nextSettings);
  writeDemoDb(db);
  return full.id;
}

export async function updateStoreSettings(storeId, payload) {
  if (supabase) {
    const storeRow = {
      name: payload.store_name,
      logo_url: payload.logo_url || null,
      primary_color: payload.primary_color,
      whatsapp_number: String(payload.whatsapp_number || "").replace(/\D/g, ""),
    };
    const settingsRow = {
      store_id: storeId,
      store_name: payload.store_name,
      logo_url: payload.logo_url || null,
      primary_color: payload.primary_color,
      whatsapp_number: storeRow.whatsapp_number,
      welcome_text: payload.welcome_text || "",
      support_channel: "WhatsApp",
      reservation_minutes: Number(payload.reservation_minutes || 60),
      reserve_stock_on_order: payload.reserve_stock_on_order !== false,
    };
    const [storeResult, settingsResult] = await Promise.all([
      supabase.from("stores").update(storeRow).eq("id", storeId),
      supabase.from("store_settings").upsert(settingsRow, { onConflict: "store_id" }),
    ]);
    if (storeResult.error) throw storeResult.error;
    if (settingsResult.error) throw settingsResult.error;
    return;
  }
  const db = readDemoDb();
  const store = db.stores.find((item) => item.id === storeId);
  if (store) Object.assign(store, { name: payload.store_name, logo_url: payload.logo_url, primary_color: payload.primary_color, whatsapp_number: payload.whatsapp_number });
  const settings = db.store_settings.find((item) => item.store_id === storeId);
  if (settings) Object.assign(settings, payload);
  writeDemoDb(db);
}

export async function assignUserToStore(storeId, userEmail, role = "store_staff") {
  if (supabase) {
    return { note: "Crea el usuario en Supabase Auth, copia su UUID y agrega la fila en store_members desde SQL." };
  }
  const db = readDemoDb();
  let profile = db.profiles.find((item) => item.email === userEmail);
  if (!profile) {
    profile = { id: uid("user"), email: userEmail, full_name: userEmail, role };
    db.profiles.push(profile);
  }
  if (!db.store_members.some((member) => member.store_id === storeId && member.user_id === profile.id)) {
    db.store_members.push({ id: uid("member"), store_id: storeId, user_id: profile.id, role, created_at: now() });
  }
  writeDemoDb(db);
  return { note: "Usuario demo asignado a tienda." };
}
