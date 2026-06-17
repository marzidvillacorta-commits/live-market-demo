"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DEMO_EMAIL, DEMO_PASSWORD, friendlyError, isSupabaseConfigured, signIn } from "@/lib/live-market";

export default function LoginPage() {
  const router = useRouter();
  const [message, setMessage] = useState("");

  async function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setMessage("Ingresando...");
    try {
      await signIn(form.get("email"), form.get("password"));
      router.replace("/admin");
    } catch {
      setMessage(friendlyError());
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 p-4 text-white">
      <section className="glass-panel w-full max-w-md rounded-xl p-6 text-slate-950">
        <Link href="/" className="text-sm font-black uppercase text-teal-700">Live Market</Link>
        <h1 className="mt-3 text-3xl font-black">Ingresar</h1>
        {!isSupabaseConfigured && (
          <p className="mt-2 text-sm font-semibold text-slate-600">
            Demo: {DEMO_EMAIL} / {DEMO_PASSWORD}
          </p>
        )}
        <form onSubmit={submit} className="mt-6 grid gap-4">
          <label className="field">Email<input name="email" type="email" required defaultValue={!isSupabaseConfigured ? DEMO_EMAIL : ""} /></label>
          <label className="field">Contrasena<input name="password" type="password" required defaultValue={!isSupabaseConfigured ? DEMO_PASSWORD : ""} /></label>
          <button className="btn-primary">Entrar al admin</button>
        </form>
        {message && <p className="mt-4 text-sm font-bold text-slate-600">{message}</p>}
      </section>
    </main>
  );
}
