"use client";

import { useEffect, useState } from "react";
import AdminShell, { useActiveStore } from "@/components/AdminShell";
import { getLiveState, listProducts, money, setLiveProduct, supabase } from "@/lib/live-market";

export default function LivePage() {
  const store = useActiveStore();
  const [products, setProducts] = useState([]);
  const [live, setLive] = useState(null);
  const [term, setTerm] = useState("");

  async function load() {
    if (!store) return;
    const [productRows, liveRow] = await Promise.all([listProducts(store.id, false), getLiveState(store.id)]);
    setProducts(productRows);
    setLive(liveRow);
  }

  useEffect(() => {
    load();
  }, [store]);

  useEffect(() => {
    if (!store || !supabase) return;
    const channel = supabase
      .channel(`live-${store.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "live_state", filter: `store_id=eq.${store.id}` }, load)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [store]);

  async function goLive(productId) {
    await setLiveProduct(store.id, productId);
    await load();
  }

  const filtered = products.filter((product) => `${product.code} ${product.name}`.toLowerCase().includes(term.toLowerCase()));

  return (
    <AdminShell title="Modo Live">
      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        <section className="card overflow-hidden">
          <div className="p-4 sm:p-5">
            <p className="text-xs font-black uppercase text-teal-700">Producto que ve el cliente</p>
            {live?.current_product ? (
              <div className="mt-4">
                <img src={live.current_product.image_url || "/globe.svg"} alt="" className="aspect-square w-full rounded-xl object-cover" />
                <p className="mt-4 text-sm font-black text-slate-500">{live.current_product.code}</p>
                <h3 className="text-2xl font-black leading-tight">{live.current_product.name}</h3>
                <p className="mt-2 text-xl font-black">{money(live.current_product.price)}</p>
                <p className="mt-2 text-sm font-semibold text-slate-500">Este producto aparece primero en el link publico de la tienda.</p>
              </div>
            ) : (
              <p className="mt-4 text-sm font-semibold text-slate-600">Selecciona un producto para mostrarlo en la tienda.</p>
            )}
          </div>
        </section>

        <section className="grid gap-3">
          <section className="card p-4">
            <h3 className="text-lg font-black">Elegir producto para el live</h3>
            <label className="field mt-3">Buscar producto<input value={term} onChange={(event) => setTerm(event.target.value)} /></label>
          </section>
          {filtered.map((product) => {
            const active = live?.current_product_id === product.id;
            return (
              <article key={product.id} className={`card grid gap-3 p-4 ${active ? "ring-2 ring-teal-600" : ""}`}>
                <div className="flex items-center gap-3">
                  <img src={product.image_url || "/globe.svg"} alt="" className="size-20 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black uppercase text-slate-500">{product.code}</p>
                    <h3 className="font-black leading-tight">{product.name}</h3>
                    <p className="text-sm font-bold text-slate-500">{money(product.price)}</p>
                  </div>
                </div>
                <button onClick={() => goLive(product.id)} className={`${active ? "btn-muted" : "btn-primary"} w-full`}>
                  {active ? "Producto en vivo" : "Poner en vivo"}
                </button>
              </article>
            );
          })}
        </section>
      </div>
    </AdminShell>
  );
}
