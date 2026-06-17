"use client";

import { useEffect, useState } from "react";
import AdminShell, { useActiveStore } from "@/components/AdminShell";
import { friendlyError, updateStoreSettings } from "@/lib/live-market";

export default function SettingsPage() {
  const store = useActiveStore();
  const [message, setMessage] = useState("");
  const [defaults, setDefaults] = useState(null);

  useEffect(() => {
    if (!store) return;
    setDefaults({
      store_name: store.store_settings?.store_name || store.name,
      logo_url: store.store_settings?.logo_url || store.logo_url || "",
      primary_color: store.store_settings?.primary_color || store.primary_color || "#0f766e",
      whatsapp_number: store.store_settings?.whatsapp_number || store.whatsapp_number || "",
      welcome_text: store.store_settings?.welcome_text || "",
      reservation_minutes: store.store_settings?.reservation_minutes || 60,
      reserve_stock_on_order: store.store_settings?.reserve_stock_on_order !== false,
    });
  }, [store]);

  async function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await updateStoreSettings(store.id, {
        store_name: form.get("store_name"),
        logo_url: form.get("logo_url"),
        primary_color: form.get("primary_color"),
        whatsapp_number: form.get("whatsapp_number"),
        welcome_text: form.get("welcome_text"),
        reservation_minutes: form.get("reservation_minutes"),
        reserve_stock_on_order: form.get("reserve_stock_on_order") === "on",
      });
      setMessage("Configuracion guardada.");
    } catch {
      setMessage(friendlyError());
    }
  }

  return (
    <AdminShell title="Configuracion">
      {defaults && (
        <section className="card max-w-3xl p-5">
          <form onSubmit={submit} className="grid gap-4">
            <label className="field">Nombre de tienda<input name="store_name" required defaultValue={defaults.store_name} /></label>
            <label className="field">Logo URL<input name="logo_url" type="url" defaultValue={defaults.logo_url} /></label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="field">Color principal<input name="primary_color" type="color" defaultValue={defaults.primary_color} /></label>
              <label className="field">WhatsApp<input name="whatsapp_number" inputMode="tel" defaultValue={defaults.whatsapp_number} /></label>
            </div>
            <label className="field">Texto de bienvenida<textarea name="welcome_text" defaultValue={defaults.welcome_text} /></label>
            <label className="field">Reserva en minutos<input name="reservation_minutes" type="number" min="1" defaultValue={defaults.reservation_minutes} /></label>
            <label className="flex items-center gap-2 text-sm font-black text-slate-600">
              <input name="reserve_stock_on_order" type="checkbox" defaultChecked={defaults.reserve_stock_on_order} />
              Reservar stock al crear cotizacion
            </label>
            <button className="btn-primary">Guardar configuracion</button>
          </form>
          {message && <p className="mt-4 text-sm font-bold text-slate-600">{message}</p>}
        </section>
      )}
    </AdminShell>
  );
}
