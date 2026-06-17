import Link from "next/link";
import { ArrowRight, Boxes, MessageCircle, Radio, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "linear-gradient(90deg, rgba(15,23,42,.92), rgba(15,23,42,.56)), url('https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1800&q=80')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="relative mx-auto grid min-h-[88vh] max-w-6xl content-center px-4 py-12 sm:px-6">
          <nav className="absolute left-4 right-4 top-4 flex items-center justify-between sm:left-6 sm:right-6">
            <Link href="/" className="text-xl font-black tracking-tight">
              Live Market
            </Link>
            <div className="flex gap-2">
              <Link href="/login" className="rounded-lg bg-white/10 px-4 py-2 text-sm font-black backdrop-blur">
                Ingresar
              </Link>
              <Link href="/urbanstyle" className="hidden rounded-lg bg-teal-500 px-4 py-2 text-sm font-black text-slate-950 sm:inline-flex">
                Ver demo
              </Link>
            </div>
          </nav>

          <div className="max-w-3xl pt-16">
            <p className="mb-4 text-sm font-black uppercase tracking-[0.22em] text-teal-300">Social commerce SaaS</p>
            <h1 className="text-5xl font-black leading-tight tracking-tight sm:text-7xl">Live Market</h1>
            <p className="mt-5 max-w-2xl text-lg font-semibold leading-8 text-slate-200">
              Una plataforma para tiendas que venden por TikTok Live, Facebook Live, Instagram, WhatsApp y transmisiones
              en vivo. Producto en vivo, stock, cotizaciones, WhatsApp y etiquetas en un solo panel.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/urbanstyle" className="btn-primary bg-teal-400 text-slate-950">
                Probar Urban Style <ArrowRight size={18} />
              </Link>
              <Link href="/zapasvip" className="btn-muted bg-white/10 text-white backdrop-blur">
                Probar Zapas VIP
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        {[
          ["Links por tienda", "Cada negocio tiene su pagina publica y su WhatsApp.", Boxes],
          ["Modo live", "La tienda cambia el producto actual en tiempo real.", Radio],
          ["Pedidos por WhatsApp", "El cliente cotiza y abre WhatsApp con resumen listo.", MessageCircle],
          ["RLS por tienda", "Usuarios autenticados ven solo tiendas asignadas.", ShieldCheck],
        ].map(([title, text, Icon]) => (
          <article key={title} className="rounded-lg border border-white/10 bg-white/5 p-5">
            <Icon className="mb-4 text-teal-300" />
            <h2 className="text-lg font-black">{title}</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">{text}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
