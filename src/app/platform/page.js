"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { assignUserToStore, getAdminStores, getSession, isPlatformAdmin, listOrders, saveStore } from "@/lib/live-market";

export default function PlatformPage() {
  const router = useRouter();
  const [stores, setStores] = useState([]);
  const [counts, setCounts] = useState({});
  const [message, setMessage] = useState("");

  async function load() {
    const session = await getSession();
    if (!session) {
      router.replace("/login");
      return;
    }
    if (!(await isPlatformAdmin())) {
      setMessage("Tu usuario no tiene acceso de plataforma.");
      return;
    }
    const rows = await getAdminStores();
    setStores(rows);
    const nextCounts = {};
    await Promise.all(rows.map(async (store) => {
      nextCounts[store.id] = (await listOrders(store.id)).length;
    }));
    setCounts(nextCounts);
  }

  useEffect(() => {
    load();
  }, []);

  async function submitStore(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await saveStore(Object.fromEntries(form.entries()));
    event.currentTarget.reset();
    setMessage("Tienda guardada.");
    await load();
  }

  async function assign(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const result = await assignUserToStore(form.get("store_id"), form.get("email"), form.get("role"));
    setMessage(result.note || "Usuario asignado.");
    event.currentTarget.reset();
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 text-slate-950 sm:p-6">
      <header className="mx-auto mb-5 flex max-w-6xl flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-teal-700">Live Market</p>
          <h1 className="text-3xl font-black">Plataforma</h1>
        </div>
        <Link href="/admin" className="btn-dark">Volver al admin</Link>
      </header>

      <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-[380px_1fr]">
        <div className="grid gap-4">
          <section className="card p-5">
            <h2 className="text-xl font-black">Crear tienda</h2>
            <form onSubmit={submitStore} className="mt-4 grid gap-3">
              <label className="field">Nombre<input name="name" required /></label>
              <label className="field">Slug<input name="slug" required /></label>
              <label className="field">WhatsApp<input name="whatsapp_number" inputMode="tel" /></label>
              <label className="field">Logo URL<input name="logo_url" type="url" /></label>
              <label className="field">Color<input name="primary_color" type="color" defaultValue="#0f766e" /></label>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <label className="field">Estado<select name="status" defaultValue="trial"><option>trial</option><option>active</option><option>suspended</option></select></label>
                <label className="field">Plan<select name="plan" defaultValue="demo"><option>demo</option><option>basic</option><option>pro</option></select></label>
              </div>
              <button className="btn-primary">Guardar tienda</button>
            </form>
          </section>

          <section className="card p-5">
            <h2 className="text-xl font-black">Asignar usuario</h2>
            <form onSubmit={assign} className="mt-4 grid gap-3">
              <label className="field">
                Tienda
                <select name="store_id">
                  {stores.map((store) => <option key={store.id} value={store.id}>{store.name}</option>)}
                </select>
              </label>
              <label className="field">Email<input name="email" type="email" required /></label>
              <label className="field">
                Rol
                <select name="role" defaultValue="store_staff">
                  <option value="store_owner">store_owner</option>
                  <option value="store_staff">store_staff</option>
                </select>
              </label>
              <button className="btn-dark">Asignar</button>
            </form>
          </section>
          {message && <p className="text-sm font-bold text-slate-600">{message}</p>}
        </div>

        <section className="grid gap-3">
          {stores.map((store) => (
            <article key={store.id} className="card p-4">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black">{store.name}</h2>
                  <p className="text-sm font-bold text-slate-500">/{store.slug} - {store.status} - {store.plan}</p>
                </div>
                <strong>{counts[store.id] || 0} pedidos</strong>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href={`/${store.slug}`} target="_blank" className="btn-muted">Tienda</Link>
                <span className="btn-muted">WhatsApp {store.whatsapp_number || store.store_settings?.whatsapp_number}</span>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
