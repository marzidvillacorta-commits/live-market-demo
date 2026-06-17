"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Boxes, ClipboardList, Home, LogOut, Radio, Settings, Store } from "lucide-react";
import { getMemberStores, getSession, isPlatformAdmin, signOut } from "@/lib/live-market";

const nav = [
  { href: "/admin/productos", label: "Productos", short: "Productos", icon: Boxes },
  { href: "/admin/live", label: "Live", short: "Live", icon: Radio },
  { href: "/admin/pedidos", label: "Pedidos", short: "Pedidos", icon: ClipboardList },
  { href: "/admin/configuracion", label: "Configuracion", short: "Config", icon: Settings },
];

export default function AdminShell({ children, title = "Dashboard" }) {
  const pathname = usePathname();
  const router = useRouter();
  const [stores, setStores] = useState([]);
  const [storeId, setStoreId] = useState("");
  const [loading, setLoading] = useState(true);
  const [platform, setPlatform] = useState(false);

  useEffect(() => {
    async function boot() {
      const session = await getSession();
      if (!session) {
        router.replace("/login");
        return;
      }
      const [storeRows, platformAccess] = await Promise.all([getMemberStores(), isPlatformAdmin()]);
      setStores(storeRows);
      setPlatform(platformAccess);
      const saved = localStorage.getItem("live_market_active_store");
      const selected = storeRows.find((store) => store.id === saved) || storeRows[0];
      if (selected) {
        setStoreId(selected.id);
        localStorage.setItem("live_market_active_store", selected.id);
      }
      setLoading(false);
    }
    boot().catch(() => setLoading(false));
  }, [router]);

  function changeStore(value) {
    setStoreId(value);
    localStorage.setItem("live_market_active_store", value);
    window.dispatchEvent(new Event("live-market-store-change"));
  }

  async function logout() {
    await signOut();
    router.replace("/login");
  }

  const activeStore = stores.find((store) => store.id === storeId);

  if (loading) return <main className="min-h-screen bg-slate-50 p-6 text-slate-700">Cargando Live Market...</main>;

  return (
    <main className="min-h-screen bg-slate-50 pb-24 text-slate-950 lg:pb-0">
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
        <aside className="hidden border-r border-slate-200 bg-white p-4 lg:block">
          <BrandBlock />
          <StoreSelector stores={stores} storeId={storeId} activeStore={activeStore} onChange={changeStore} />
          <DesktopNav pathname={pathname} platform={platform} />
          <button onClick={logout} className="mt-5 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 text-sm font-black text-white">
            <LogOut size={16} /> Salir
          </button>
        </aside>

        <section className="min-w-0 p-4 sm:p-6">
          <header className="sticky top-0 z-10 -mx-4 -mt-4 mb-4 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:-mt-6 sm:px-6 lg:static lg:mx-0 lg:mt-0 lg:border-0 lg:bg-transparent lg:p-0 lg:pb-5">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase text-teal-700">{activeStore ? `Estas administrando: ${activeStore.name}` : "Panel de mi tienda"}</p>
                <h2 className="truncate text-2xl font-black tracking-tight">{title}</h2>
              </div>
              {activeStore && (
                <Link href={`/${activeStore.slug}`} target="_blank" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700">
                  Ver tienda
                </Link>
              )}
            </div>
            <div className="mt-3 lg:hidden">
              <StoreSelector stores={stores} storeId={storeId} activeStore={activeStore} onChange={changeStore} compact />
            </div>
          </header>
          {stores.length ? children : <div className="rounded-lg border border-slate-200 bg-white p-6 text-slate-600">No tienes tiendas asignadas.</div>}
        </section>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-slate-200 bg-white px-2 py-2 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] lg:hidden">
        <MobileNavItem href="/admin" label="Inicio" icon={Home} active={pathname === "/admin"} />
        {nav.map((item) => <MobileNavItem key={item.href} href={item.href} label={item.short} icon={item.icon} active={pathname === item.href} />)}
      </nav>
    </main>
  );
}

function BrandBlock() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid size-10 place-items-center rounded-lg bg-teal-700 text-white"><Store size={20} /></div>
      <div>
        <p className="text-xs font-black uppercase text-teal-700">Live Market</p>
        <h1 className="text-lg font-black">Panel de mi tienda</h1>
      </div>
    </div>
  );
}

function StoreSelector({ stores, storeId, activeStore, onChange, compact = false }) {
  if (stores.length > 1) {
    return (
      <label className={`${compact ? "block" : "mt-5 block"} text-xs font-black uppercase text-slate-500`}>
        Tienda activa
        <select className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-950" value={storeId} onChange={(event) => onChange(event.target.value)}>
          {stores.map((store) => <option key={store.id} value={store.id}>{store.name}</option>)}
        </select>
        {!compact && <span className="mt-2 block text-[11px] font-bold normal-case text-slate-400">Este selector solo aparece si tu usuario administra mas de una tienda.</span>}
      </label>
    );
  }
  return (
    <div className={`${compact ? "" : "mt-5"} rounded-lg bg-slate-50 p-3 text-xs font-black uppercase text-slate-500`}>
      Tienda asignada
      <p className="mt-1 text-sm normal-case text-slate-900">{activeStore?.name || "Sin tienda"}</p>
    </div>
  );
}

function DesktopNav({ pathname, platform }) {
  return (
    <nav className="mt-5 grid gap-2">
      <Link href="/admin" className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-black ${pathname === "/admin" ? "bg-teal-50 text-teal-800" : "text-slate-600 hover:bg-slate-50"}`}>
        <Home size={18} /> Dashboard
      </Link>
      {nav.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href;
        return (
          <Link key={item.href} href={item.href} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-black ${active ? "bg-teal-50 text-teal-800" : "text-slate-600 hover:bg-slate-50"}`}>
            <Icon size={18} /> {item.label}
          </Link>
        );
      })}
      {platform && <Link href="/platform" className="rounded-lg px-3 py-2 text-sm font-black text-slate-600 hover:bg-slate-50">Panel Live Market</Link>}
    </nav>
  );
}

function MobileNavItem({ href, label, icon: Icon, active }) {
  return (
    <Link href={href} className={`grid place-items-center gap-1 rounded-xl px-1 py-2 text-[11px] font-black ${active ? "bg-teal-50 text-teal-800" : "text-slate-500"}`}>
      <Icon size={19} />
      <span>{label}</span>
    </Link>
  );
}

export function useActiveStore() {
  const [store, setStore] = useState(null);

  useEffect(() => {
    async function load() {
      const stores = await getMemberStores();
      const saved = localStorage.getItem("live_market_active_store");
      setStore(stores.find((item) => item.id === saved) || stores[0] || null);
    }
    load();
    window.addEventListener("live-market-store-change", load);
    return () => window.removeEventListener("live-market-store-change", load);
  }, []);

  return store;
}
