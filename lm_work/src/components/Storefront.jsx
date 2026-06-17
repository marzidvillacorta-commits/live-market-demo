"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, MapPin, Search, ShoppingBag, X } from "lucide-react";
import {
  buildWhatsAppMessage,
  createOrder,
  getLiveState,
  getPublicStore,
  money,
  searchProduct,
  supabase,
  variantName,
} from "@/lib/live-market";
import { PERU_DEPARTMENTS, getDistricts, getProvinces } from "@/lib/peru-locations";

export default function Storefront({ slug }) {
  const [store, setStore] = useState(null);
  const [live, setLive] = useState(null);
  const [code, setCode] = useState("");
  const [product, setProduct] = useState(null);
  const [message, setMessage] = useState("");
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const productRef = useRef(null);

  useEffect(() => {
    async function load() {
      const storeData = await getPublicStore(slug);
      setStore(storeData);
      if (storeData) setLive(await getLiveState(storeData.id));
      setLoading(false);
    }
    load().catch(() => {
      setMessage("La tienda no esta disponible por ahora.");
      setLoading(false);
    });
  }, [slug]);

  useEffect(() => {
    if (!store || !supabase) return;
    const channel = supabase
      .channel(`public-live-${store.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "live_state", filter: `store_id=eq.${store.id}` }, async () => {
        setLive(await getLiveState(store.id));
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [store]);

  const total = useMemo(() => cart.reduce((sum, item) => sum + item.unit_price * item.quantity, 0), [cart]);
  const brand = store?.store_settings?.primary_color || store?.primary_color || "#0f766e";

  async function loadProductByCode(rawCode, scroll = true) {
    if (!store || !rawCode) return;
    setMessage("Buscando producto...");
    const found = await searchProduct(store.id, rawCode);
    if (!found) {
      setProduct(null);
      setMessage("No encontramos un producto activo con ese codigo.");
      return;
    }
    setProduct(found);
    setCode(found.code);
    setMessage("");
    if (scroll) setTimeout(() => productRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  }

  async function submitSearch(event) {
    event.preventDefault();
    if (!code.trim()) return;
    await loadProductByCode(code);
  }

  function addToCart(event) {
    event.preventDefault();
    if (!product) return;
    const form = new FormData(event.currentTarget);
    const variantId = form.get("variant_id") || "";
    const quantity = Math.max(Number(form.get("quantity") || 1), 1);
    const variant = product.product_variants?.find((item) => item.id === variantId);
    const available = Number(variant?.stock ?? 999999);
    const alreadyInCart = cart
      .filter((item) => item.product_id === product.id && (item.variant_id || "") === variantId)
      .reduce((sum, item) => sum + item.quantity, 0);

    if (variant && alreadyInCart + quantity > available) {
      setMessage("No hay stock suficiente para esa variante.");
      return;
    }

    const unit = Number(product.price || 0) + Number(variant?.price_delta || 0);
    setCart((items) => [
      ...items,
      {
        product_id: product.id,
        variant_id: variant?.id || null,
        code: product.code,
        name: product.name,
        variant_name: variant ? variantName(variant) : "",
        quantity,
        unit_price: unit,
      },
    ]);
    setCartOpen(true);
    setMessage("Producto agregado al pedido.");
  }

  async function submitOrder(event) {
    event.preventDefault();
    if (!cart.length || !store) return;
    const form = new FormData(event.currentTarget);
    const customer = Object.fromEntries(form.entries());
    customer.shipping_agency = "Shalom";
    customer.city = [customer.district, customer.province, customer.department].filter(Boolean).join(", ");
    try {
      const result = await createOrder(store, customer, cart);
      const msg = buildWhatsAppMessage(result.order_code, customer, cart, result.total_amount || total);
      const number = String(store.whatsapp_number || store.store_settings?.whatsapp_number || "").replace(/\D/g, "");
      if (number) window.open(`https://wa.me/${number}?text=${encodeURIComponent(msg)}`, "_blank", "noopener,noreferrer");
      setCart([]);
      event.currentTarget.reset();
      setMessage(`Cotizacion ${result.order_code} creada.`);
    } catch {
      setMessage("No pudimos crear la cotizacion. Revisa tus datos e intentalo nuevamente.");
    }
  }

  if (loading) return <main className="min-h-screen bg-slate-50 p-6">Cargando tienda...</main>;
  if (!store) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 p-6 text-center">
        <section className="card max-w-md p-6">
          <h1 className="text-2xl font-black">Tienda no disponible</h1>
          <p className="mt-2 text-slate-600">Revisa el link o pide uno nuevo a la tienda.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-28 text-slate-950" style={{ "--store": brand }}>
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-xl text-lg font-black text-white" style={{ background: brand }}>
              {store.logo_url ? <img src={store.logo_url} alt="" className="size-full rounded-xl object-cover" /> : store.name.slice(0, 1)}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase text-slate-500">Live Market</p>
              <h1 className="truncate font-black">{store.name}</h1>
            </div>
          </div>
          <button onClick={() => setCartOpen((value) => !value)} className="btn-muted shrink-0">
            <ShoppingBag size={18} /> {cart.length}
          </button>
        </div>
      </header>

      <section className="mx-auto grid max-w-5xl gap-4 px-4 py-4 lg:grid-cols-[1fr_380px]">
        <div className="grid gap-4">
          <article className="card overflow-hidden border-2" style={{ borderColor: `${brand}22` }}>
            <div className="p-4 sm:p-5">
              <p className="text-xs font-black uppercase text-teal-700">Producto en vivo ahora</p>
              {live?.current_product ? (
                <div className="mt-3 grid gap-4">
                  <div className="grid gap-4 sm:grid-cols-[150px_1fr]">
                    <img src={live.current_product.image_url || "/globe.svg"} alt="" className="aspect-square w-full rounded-xl object-cover" />
                    <div>
                      <p className="text-sm font-black text-slate-500">Codigo: {live.current_product.code}</p>
                      <h2 className="text-2xl font-black leading-tight">{live.current_product.name}</h2>
                      <p className="mt-2 text-sm font-semibold text-slate-600">{live.current_product.description}</p>
                      <p className="mt-3 text-2xl font-black" style={{ color: brand }}>{money(live.current_product.price)}</p>
                    </div>
                  </div>
                  <button onClick={() => loadProductByCode(live.current_product.code)} className="btn-primary w-full text-base" style={{ background: brand }}>
                    Quiero este producto
                  </button>
                </div>
              ) : (
                <p className="mt-3 text-slate-600">La tienda aun no selecciona producto en vivo.</p>
              )}
            </div>
          </article>

          <article className="card p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="grid size-9 shrink-0 place-items-center rounded-full bg-slate-900 text-white text-sm font-black">1</div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-black">Busca por codigo</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">Tambien puedes escribir el codigo que viste en el live.</p>
                <form onSubmit={submitSearch} className="mt-4 grid gap-3 sm:grid-cols-[1fr_150px]">
                  <label className="field">
                    Codigo
                    <input value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} />
                  </label>
                  <button className="btn-primary self-end" style={{ background: brand }}>
                    <Search size={18} /> Buscar
                  </button>
                </form>
                {message && <p className="mt-3 text-sm font-bold text-slate-600">{message}</p>}
              </div>
            </div>
          </article>

          {product && (
            <article ref={productRef} className="card grid gap-4 p-4 sm:grid-cols-[170px_1fr] sm:p-5">
              <img src={product.image_url || "/globe.svg"} alt="" className="aspect-square w-full rounded-xl object-cover" />
              <div>
                <p className="text-sm font-black text-slate-500">{product.code}</p>
                <h2 className="text-2xl font-black leading-tight">{product.name}</h2>
                <p className="mt-2 text-sm font-semibold text-slate-600">{product.description}</p>
                <p className="mt-3 text-xl font-black">{money(product.price)}</p>
                <form onSubmit={addToCart} className="mt-4 grid gap-3">
                  {product.product_variants?.length ? (
                    <label className="field">
                      Elige talla, color o modelo
                      <select name="variant_id" required>
                        {product.product_variants.map((variant) => (
                          <option key={variant.id} value={variant.id} disabled={Number(variant.stock) <= 0}>
                            {variantName(variant)} - {variant.stock} disponibles
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                  <label className="field">
                    Cantidad
                    <input name="quantity" type="number" min="1" defaultValue="1" />
                  </label>
                  <button className="btn-dark w-full text-base">Agregar al pedido</button>
                </form>
              </div>
            </article>
          )}
        </div>

        <aside className={`${cartOpen ? "fixed inset-0 z-30 overflow-auto bg-white p-4" : "hidden"} lg:sticky lg:top-20 lg:block lg:h-fit lg:bg-transparent lg:p-0`}>
          <div className="card p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase text-slate-500">Paso 2</p>
                <h2 className="text-xl font-black">Tu pedido</h2>
              </div>
              <button className="lg:hidden" onClick={() => setCartOpen(false)} aria-label="Cerrar"><X /></button>
            </div>
            <div className="mt-4 grid gap-3">
              {cart.length ? (
                cart.map((item, index) => (
                  <div key={`${item.product_id}-${index}`} className="rounded-xl bg-slate-50 p-3">
                    <p className="font-black">{item.name}</p>
                    <p className="text-sm font-bold text-slate-500">{item.code} {item.variant_name}</p>
                    <p className="text-sm font-black">{item.quantity} x {money(item.unit_price)}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm font-semibold text-slate-500">Agrega el producto en vivo o busca por codigo para iniciar.</p>
              )}
            </div>
            <div className="mt-4 rounded-xl bg-slate-900 p-3 text-white">
              <p className="text-xs font-black uppercase text-white/70">Total para confirmar por WhatsApp</p>
              <p className="text-2xl font-black">{money(total)}</p>
            </div>
            <OrderForm disabled={!cart.length} onSubmit={submitOrder} brand={brand} />
          </div>
        </aside>
      </section>
    </main>
  );
}

function OrderForm({ onSubmit, disabled, brand }) {
  const [department, setDepartment] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const provinces = getProvinces(department);
  const districts = getDistricts(department, province);

  useEffect(() => {
    setProvince("");
    setDistrict("");
  }, [department]);

  useEffect(() => {
    setDistrict("");
  }, [province]);

  return (
    <form onSubmit={onSubmit} className="mt-4 grid gap-3">
      <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm font-black text-emerald-800">
        <CheckCircle2 size={18} /> Paso 3: llena tus datos de envio
      </div>
      <label className="field">Nombres y apellidos completos<input name="customer_name" required /></label>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        <label className="field">DNI<input name="customer_dni" required inputMode="numeric" maxLength={12} /></label>
        <label className="field">Celular<input name="phone" required inputMode="tel" /></label>
      </div>
      <label className="field">Usuario de TikTok / red social<input name="social_user" /></label>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        <label className="field">
          Departamento
          <select name="department" required value={department} onChange={(event) => setDepartment(event.target.value)}>
            <option value="">Seleccionar</option>
            {PERU_DEPARTMENTS.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label className="field">
          Provincia
          {provinces.length ? (
            <select name="province" required value={province} onChange={(event) => setProvince(event.target.value)}>
              <option value="">Seleccionar</option>
              {provinces.map((item) => <option key={item}>{item}</option>)}
            </select>
          ) : <input name="province" required />}
        </label>
      </div>
      <label className="field">
        Distrito
        {districts.length ? (
          <select name="district" required value={district} onChange={(event) => setDistrict(event.target.value)}>
            <option value="">Seleccionar</option>
            {districts.map((item) => <option key={item}>{item}</option>)}
          </select>
        ) : <input name="district" required />}
      </label>
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <div className="flex items-center gap-2 text-sm font-black text-slate-700"><MapPin size={17} /> Agencia principal: Shalom</div>
        <input type="hidden" name="shipping_agency" value="Shalom" />
      </div>
      <label className="field">Otra agencia opcional<input name="shipping_agency_other" /></label>
      <label className="field">Oficina Shalom destino<input name="agency_office" required /></label>
      <label className="field">Referencia<textarea name="address_reference" /></label>
      <label className="field">Nota opcional<textarea name="note" /></label>
      <button disabled={disabled} className="btn-primary disabled:opacity-50" style={{ background: brand }}>
        Enviar cotizacion por WhatsApp
      </button>
    </form>
  );
}
