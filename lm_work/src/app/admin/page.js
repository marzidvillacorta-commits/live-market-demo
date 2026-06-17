"use client";

import { useEffect, useState } from "react";
import AdminShell, { useActiveStore } from "@/components/AdminShell";
import { getLiveState, listOrders, listProducts, money } from "@/lib/live-market";

export default function AdminPage() {
  const store = useActiveStore();
  const [stats, setStats] = useState({ products: 0, orders: 0, sales: 0, live: "" });

  useEffect(() => {
    async function load() {
      if (!store) return;
      const [products, orders, live] = await Promise.all([listProducts(store.id), listOrders(store.id), getLiveState(store.id)]);
      setStats({
        products: products.length,
        orders: orders.length,
        sales: orders.filter((order) => order.status === "pagado").reduce((sum, order) => sum + Number(order.total_amount || 0), 0),
        live: live?.current_product?.name || "Sin producto en vivo",
      });
    }
    load();
  }, [store]);

  return (
    <AdminShell title="Dashboard">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Productos" value={stats.products} />
        <Metric label="Pedidos" value={stats.orders} />
        <Metric label="Vendido" value={money(stats.sales)} />
        <Metric label="En vivo" value={stats.live} />
      </div>
      <section className="card mt-5 p-5">
        <h3 className="text-xl font-black">Operaciones principales</h3>
        <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-600">
          Administra productos, selecciona el producto que esta saliendo en vivo, revisa cotizaciones y prepara etiquetas
          de envio desde las secciones laterales.
        </p>
      </section>
    </AdminShell>
  );
}

function Metric({ label, value }) {
  return (
    <article className="card p-5">
      <p className="text-xs font-black uppercase text-slate-500">{label}</p>
      <strong className="mt-2 block text-2xl font-black">{value}</strong>
    </article>
  );
}
