"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { buildLabel, listOrders } from "@/lib/live-market";
import { useActiveStore } from "@/components/AdminShell";

export default function PrintableLabelPage() {
  const params = useParams();
  const store = useActiveStore();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!store || !params?.id) return;
      const orders = await listOrders(store.id);
      setOrder(orders.find((item) => item.id === params.id) || null);
      setLoading(false);
    }
    load();
  }, [store, params?.id]);

  const label = useMemo(() => (store && order ? buildLabel(store, order) : ""), [store, order]);

  if (loading) return <main className="min-h-screen bg-white p-6 text-slate-700">Cargando etiqueta...</main>;
  if (!store || !order) {
    return (
      <main className="min-h-screen bg-white p-6 text-slate-900">
        <p className="font-bold">No se encontro la etiqueta o no pertenece a tu tienda activa.</p>
        <Link href="/admin/pedidos" className="mt-4 inline-flex rounded-lg bg-slate-900 px-4 py-2 font-black text-white">Volver a pedidos</Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white p-4 text-slate-950 print:p-0">
      <div className="mx-auto max-w-lg">
        <div className="no-print mb-4 flex flex-wrap gap-2">
          <Link href="/admin/pedidos" className="btn-muted">Volver</Link>
          <button onClick={() => window.print()} className="btn-dark">Imprimir etiqueta</button>
        </div>

        <section className="border-2 border-slate-950 p-4 print:border-black">
          <pre className="whitespace-pre-wrap font-sans text-[15px] font-semibold leading-relaxed">{label}</pre>
        </section>

        <p className="no-print mt-3 text-xs font-bold text-slate-500">
          Esta etiqueta no muestra monto, precio, metodo de pago ni contenido del paquete por seguridad.
        </p>
      </div>
    </main>
  );
}
