"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, ShoppingBag, X } from "lucide-react";
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

export default function Storefront({ slug }) {
  const [store, setStore] = useState(null);
  const [live, setLive] = useState(null);
  const [code, setCode] = useState("");
  const [product, setProduct] = useState(null);
  const [message, setMessage] = useState("");
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);

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

  async function submitSearch(event) {
    event.preventDefault();
    if (!store || !code.trim()) return;
    setMessage("Buscando producto...");
    const found = await searchProduct(store.id, code);
    if (!found) {
      setProduct(null);
      setMessage("No encontramos un producto activo con ese codigo.");
      return;
    }
    setProduct(found);
    setMessage("");
  }

  function addToCart(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const variantId = form.get("variant_id") || "";
    const quantity = Math.max(Number(form.get("quantity") || 1), 1);
    const variant = product.product_variants?.find((item) => item.id === variantId);
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
      setMessage("No pudimos crear la cotizacion. Intentalo nuevamente.");
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
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-lg text-lg font-black text-white" style={{ background: brand }}>
              {store.logo_url ? <img src={store.logo_url} alt="" className="size-full rounded-lg object-cover" /> : store.name.slice(0, 1)}
            </div>
            <div>
              <p className="text-xs font-black uppercase text-slate-500">Live Market</p>
              <h1 className="font-black">{store.name}</h1>
            </div>
          </div>
          <button onClick={() => setCartOpen((value) => !value)} className="btn-muted">
            <ShoppingBag size={18} /> {cart.length}
          </button>
        </div>
      </header>

      <section className="mx-auto grid max-w-5xl gap-4 px-4 py-5 lg:grid-cols-[1fr_360px]">
        <div className="grid gap-4">
          <article className="card overflow-hidden">
            <div className="p-5">
              <p className="text-xs font-black uppercase text-teal-700">Producto en vivo</p>
              {live?.current_product ? (
                <div className="mt-3 grid gap-4 sm:grid-cols-[160px_1fr]">
                  <img src={live.current_product.image_url || "/globe.svg"} alt="" className="aspect-square rounded-lg object-cover" />
                  <div>
                    <p className="text-sm font-black text-slate-500">{live.current_product.code}</p>
                    <h2 className="text-2xl font-black">{live.current_product.name}</h2>
                    <p className="mt-2 text-slate-600">{live.current_product.description}</p>
                    <p className="mt-3 text-2xl font-black" style={{ color: brand }}>
                      {money(live.current_product.price)}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-slate-600">La tienda aun no selecciona producto en vivo.</p>
              )}
            </div>
          </article>

          <article className="card p-5">
            <h2 className="text-xl font-black">Busca por codigo</h2>
            <form onSubmit={submitSearch} className="mt-4 grid gap-3 sm:grid-cols-[1fr_150px]">
              <label className="field">
                Codigo
                <input value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="Ej: URB101" />
              </label>
              <button className="btn-primary self-end" style={{ background: brand }}>
                <Search size={18} /> Buscar
              </button>
            </form>
            {message && <p className="mt-3 text-sm font-bold text-slate-600">{message}</p>}
          </article>

          {product && (
            <article className="card grid gap-4 p-5 sm:grid-cols-[180px_1fr]">
              <img src={product.image_url || "/globe.svg"} alt="" className="aspect-square rounded-lg object-cover" />
              <div>
                <p className="text-sm font-black text-slate-500">{product.code}</p>
                <h2 className="text-2xl font-black">{product.name}</h2>
                <p className="mt-2 text-slate-600">{product.description}</p>
                <p className="mt-3 text-xl font-black">{money(product.price)}</p>
                <form onSubmit={addToCart} className="mt-4 grid gap-3">
                  {product.product_variants?.length ? (
                    <label className="field">
                      Variante
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
                  <button className="btn-dark">Agregar al pedido</button>
                </form>
              </div>
            </article>
          )}
        </div>

        <aside className={`${cartOpen ? "fixed inset-0 z-30 overflow-auto bg-white p-4" : "hidden"} lg:sticky lg:top-20 lg:block lg:h-fit lg:bg-transparent lg:p-0`}>
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black">Tu cotizacion</h2>
              <button className="lg:hidden" onClick={() => setCartOpen(false)} aria-label="Cerrar">
                <X />
              </button>
            </div>
            <div className="mt-4 grid gap-3">
              {cart.length ? (
                cart.map((item, index) => (
                  <div key={`${item.product_id}-${index}`} className="rounded-lg bg-slate-50 p-3">
                    <p className="font-black">{item.name}</p>
                    <p className="text-sm font-bold text-slate-500">
                      {item.code} {item.variant_name}
                    </p>
                    <p className="text-sm font-black">{item.quantity} x {money(item.unit_price)}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm font-semibold text-slate-500">Agrega productos por codigo para iniciar.</p>
              )}
            </div>
            <p className="mt-4 text-2xl font-black">{money(total)}</p>
            <OrderForm disabled={!cart.length} onSubmit={submitOrder} brand={brand} />
          </div>
        </aside>
      </section>
    </main>
  );
}

function OrderForm({ onSubmit, disabled, brand }) {
  return (
    <form onSubmit={onSubmit} className="mt-4 grid gap-3">
      <label className="field">Nombre<input name="customer_name" required /></label>
      <label className="field">Celular<input name="phone" required inputMode="tel" /></label>
      <label className="field">Usuario/red social<input name="social_user" /></label>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        <label className="field">Departamento<input name="department" required /></label>
        <label className="field">Provincia<input name="province" required /></label>
      </div>
      <label className="field">Distrito<input name="district" required /></label>
      <label className="field">
        Agencia
        <select name="shipping_agency" defaultValue="Shalom">
          <option>Shalom</option>
          <option>Olva Courier</option>
          <option>Marvisur</option>
          <option>Otra</option>
        </select>
      </label>
      <label className="field">Otra agencia<input name="shipping_agency_other" /></label>
      <label className="field">Oficina o agencia destino<input name="agency_office" required /></label>
      <label className="field">Referencia<textarea name="address_reference" /></label>
      <label className="field">Nota opcional<textarea name="note" /></label>
      <button disabled={disabled} className="btn-primary disabled:opacity-50" style={{ background: brand }}>
        Enviar cotizacion por WhatsApp
      </button>
    </form>
  );
}
