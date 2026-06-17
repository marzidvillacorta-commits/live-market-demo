"use client";

import { useEffect, useState } from "react";
import AdminShell, { useActiveStore } from "@/components/AdminShell";
import { friendlyError, listProducts, money, saveProduct, saveVariant, variantName } from "@/lib/live-market";

export default function ProductsPage() {
  const store = useActiveStore();
  const [products, setProducts] = useState([]);
  const [message, setMessage] = useState("");

  async function load() {
    if (!store) return;
    setProducts(await listProducts(store.id));
  }

  useEffect(() => {
    load();
  }, [store]);

  async function submitProduct(event) {
    event.preventDefault();
    if (!store) return;
    const form = new FormData(event.currentTarget);
    try {
      await saveProduct(store.id, {
        name: form.get("name"),
        code: form.get("code"),
        description: form.get("description"),
        price: form.get("price"),
        category: form.get("category"),
        image_url: form.get("image_url"),
        image_file: form.get("image_file")?.size ? form.get("image_file") : null,
        is_active: true,
      });
      event.currentTarget.reset();
      setMessage("Producto guardado.");
      await load();
    } catch {
      setMessage(friendlyError());
    }
  }

  async function submitVariant(event) {
    event.preventDefault();
    if (!store) return;
    const form = new FormData(event.currentTarget);
    try {
      await saveVariant(store.id, Object.fromEntries(form.entries()));
      event.currentTarget.reset();
      setMessage("Variante guardada.");
      await load();
    } catch {
      setMessage(friendlyError());
    }
  }

  return (
    <AdminShell title="Productos">
      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <section className="card p-5">
          <h3 className="text-xl font-black">Crear producto</h3>
          <form onSubmit={submitProduct} className="mt-4 grid gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="field">Nombre<input name="name" required /></label>
              <label className="field">Codigo<input name="code" required /></label>
            </div>
            <label className="field">Descripcion<textarea name="description" /></label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="field">Precio<input name="price" type="number" min="0" step="0.01" required /></label>
              <label className="field">Categoria<input name="category" /></label>
            </div>
            <label className="field">Imagen URL<input name="image_url" type="url" /></label>
            <label className="field">Subir imagen<input name="image_file" type="file" accept="image/*" /></label>
            <button className="btn-primary">Guardar producto</button>
          </form>
          {message && <p className="mt-3 text-sm font-bold text-slate-600">{message}</p>}
        </section>

        <section className="card p-5">
          <h3 className="text-xl font-black">Crear variante</h3>
          <form onSubmit={submitVariant} className="mt-4 grid gap-3">
            <label className="field">
              Producto
              <select name="product_id" required>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>{product.code} - {product.name}</option>
                ))}
              </select>
            </label>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <label className="field">
                Variante
                <select name="option_name" defaultValue="talla">
                  <option value="talla">Talla</option>
                  <option value="color">Color</option>
                  <option value="numero">Numero</option>
                  <option value="modelo">Modelo</option>
                  <option value="presentacion">Presentacion</option>
                </select>
              </label>
              <label className="field">Valor<input name="option_value" required /></label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <label className="field">Stock<input name="stock" type="number" min="0" required /></label>
              <label className="field">Precio adicional<input name="price_delta" type="number" step="0.01" defaultValue="0" /></label>
            </div>
            <button className="btn-dark">Guardar variante</button>
          </form>
        </section>
      </div>

      <section className="mt-5 grid gap-3">
        {products.map((product) => (
          <article key={product.id} className="card grid gap-4 p-4 sm:grid-cols-[96px_1fr]">
            <img src={product.image_url || "/globe.svg"} alt="" className="aspect-square rounded-lg object-cover" />
            <div>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-black uppercase text-slate-500">{product.code}</p>
                  <h3 className="text-lg font-black">{product.name}</h3>
                  <p className="text-sm font-bold text-slate-500">{money(product.price)} - {product.category}</p>
                </div>
                <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-black text-teal-800">Activo</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {(product.product_variants || []).map((variant) => (
                  <span key={variant.id} className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                    {variantName(variant)}: {variant.stock}
                  </span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </section>
    </AdminShell>
  );
}
