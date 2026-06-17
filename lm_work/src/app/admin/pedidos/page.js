"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AdminShell, { useActiveStore } from "@/components/AdminShell";
import { buildLabel, listOrders, money, updateOrderStatus } from "@/lib/live-market";

const statuses = ["nuevo", "separado", "pendiente", "confirmado", "pagado", "preparando", "enviado", "cancelado"];

export default function OrdersPage() {
  const store = useActiveStore();
  const [orders, setOrders] = useState([]);

  async function load() {
    if (!store) return;
    setOrders(await listOrders(store.id));
  }

  useEffect(() => {
    load();
  }, [store]);

  async function changeStatus(orderId, status) {
    await updateOrderStatus(store.id, orderId, status);
    await load();
  }

  function copyCare(order) {
    const text = [
      `Hola ${order.customer_name}, tu cotizacion ${order.order_code} fue registrada.`,
      `Estado: ${order.status}.`,
      ...(order.order_items || []).map((item) => `- ${item.quantity}x ${item.product_code} ${item.product_name}`),
      `Total: ${money(order.total_amount)}.`,
      "Te contactamos para coordinar el pago y envio.",
    ].join("\n");
    navigator.clipboard?.writeText(text);
  }

  function copyLabel(order) {
    navigator.clipboard?.writeText(buildLabel(store, order));
  }

  function printLabel(order) {
    const text = buildLabel(store, order);
    const popup = window.open("", "_blank", "noopener,noreferrer,width=480,height=720");
    if (!popup) return;
    popup.document.write(`<!doctype html><html><head><title>Etiqueta ${order.order_code}</title><style>body{font-family:Arial,sans-serif;padding:18px;color:#111}.label{border:2px solid #111;padding:16px;white-space:pre-wrap;font-size:15px;line-height:1.35}.actions{margin-bottom:12px}@media print{.actions{display:none}body{padding:0}.label{border:2px solid #111}}</style></head><body><div class="actions"><button onclick="window.print()">Imprimir etiqueta</button></div><pre class="label"></pre></body></html>`);
    popup.document.querySelector(".label").textContent = text;
    popup.document.close();
    popup.focus();
  }

  function exportCsv() {
    const rows = [
      ["codigo", "estado", "cliente", "dni", "celular", "departamento", "provincia", "distrito", "agencia", "total", "fecha"],
      ...orders.map((order) => [
        order.order_code,
        order.status,
        order.customer_name,
        order.customer_dni,
        order.phone,
        order.department,
        order.province,
        order.district,
        order.shipping_agency,
        order.total_amount,
        order.created_at,
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `live-market-${store.slug}-pedidos.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AdminShell title="Pedidos">
      <div className="mb-4 flex justify-end">
        <button onClick={exportCsv} className="btn-dark">Exportar pedidos</button>
      </div>
      <section className="grid gap-3">
        {orders.length ? orders.map((order) => (
          <article key={order.id} className="card p-4">
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase text-slate-500">{order.order_code}</p>
                <h3 className="text-lg font-black">{order.customer_name}</h3>
                <p className="text-sm font-bold text-slate-500">DNI: {order.customer_dni || "No registrado"}</p>
                <p className="text-sm font-bold text-slate-500">{order.phone} - {order.district}, {order.province}</p>
              </div>
              <strong className="text-xl">{money(order.total_amount)}</strong>
            </div>
            <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm font-semibold text-slate-600">
              {(order.order_items || []).map((item) => (
                <p key={item.id}>{item.quantity}x {item.product_code} {item.product_name} {item.variant_label}</p>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <select className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold" value={order.status} onChange={(event) => changeStatus(order.id, event.target.value)}>
                {statuses.map((status) => <option key={status}>{status}</option>)}
              </select>
              <button onClick={() => copyCare(order)} className="btn-muted">Copiar atencion</button>
              <button onClick={() => copyLabel(order)} className="btn-muted">Copiar etiqueta</button>
              <Link href={`/admin/pedidos/${order.id}/etiqueta`} className="btn-muted">Ver etiqueta</Link>
              <button onClick={() => printLabel(order)} className="btn-muted">Imprimir etiqueta</button>
            </div>
          </article>
        )) : <div className="card p-6 text-sm font-semibold text-slate-600">Aun no hay pedidos en esta tienda.</div>}
      </section>
    </AdminShell>
  );
}
