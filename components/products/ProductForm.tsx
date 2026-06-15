"use client";

import { useState } from "react";
import type { Product, ProductStatus } from "@/types";
import { useCategories, useQualities } from "@/hooks/useCatalog";
import ImageGallery from "./ImageGallery";

interface SizeInput {
  size: string;
  stock: number;
  purchasePrice: string; // vacío = usa el del producto
  salePrice: string;     // vacío = usa el del producto
}

interface ProductFormData {
  brand: string;
  model: string;
  colorway: string;
  description: string;
  status: ProductStatus;
  purchasePrice: string;
  salePrice: string;
  categoryId: string;
  qualityId: string;
  sizes: SizeInput[];
  images: string[];
}

interface ProductFormProps {
  initial?: Partial<Product>;
  onSubmit: (data: ProductFormData) => void;
  loading: boolean;
  error?: string;
  submitLabel?: string;
}

const STATUSES: { value: ProductStatus; label: string }[] = [
  { value: "IN_STOCK",    label: "En stock" },
  { value: "ON_REQUEST",  label: "A pedido" },
  { value: "UNAVAILABLE", label: "No disponible" },
];

const inputCls = "w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20";
const smallInputCls = "rounded-lg bg-zinc-800 border border-zinc-700 px-2 py-1.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/20 w-full";

export default function ProductForm({ initial, onSubmit, loading, error, submitLabel = "Guardar producto" }: ProductFormProps) {
  const { data: categories = [] } = useCategories();
  const { data: qualities = [] } = useQualities();

  const [form, setForm] = useState<ProductFormData>({
    brand:         initial?.brand         ?? "",
    model:         initial?.model         ?? "",
    colorway:      initial?.colorway      ?? "",
    description:   initial?.description   ?? "",
    status:        initial?.status        ?? "IN_STOCK",
    purchasePrice: initial?.purchasePrice ? String(parseFloat(initial.purchasePrice)) : "",
    salePrice:     initial?.salePrice     ? String(parseFloat(initial.salePrice))     : "",
    categoryId:    initial?.categoryId    ?? "",
    qualityId:     initial?.qualityId     ?? "",
    sizes: initial?.sizes?.map((s) => ({
      size:          s.size,
      stock:         s.stock,
      purchasePrice: s.purchasePrice ? String(parseFloat(s.purchasePrice)) : "",
      salePrice:     s.salePrice     ? String(parseFloat(s.salePrice))     : "",
    })) ?? [{ size: "", stock: 1, purchasePrice: "", salePrice: "" }],
    images: initial?.images ?? [],
  });

  function set(field: keyof Omit<ProductFormData, "sizes">, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function addSize() {
    setForm((f) => ({ ...f, sizes: [...f.sizes, { size: "", stock: 1, purchasePrice: "", salePrice: "" }] }));
  }

  function removeSize(i: number) {
    setForm((f) => ({ ...f, sizes: f.sizes.filter((_, idx) => idx !== i) }));
  }

  function updateSize(i: number, field: keyof SizeInput, value: string | number) {
    setForm((f) => {
      const sizes = [...f.sizes];
      sizes[i] = { ...sizes[i], [field]: value };
      return { ...f, sizes };
    });
  }

  const hasPriceOverride = form.sizes.some((s) => s.purchasePrice !== "" || s.salePrice !== "");

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Marca</label>
          <input className={inputCls} placeholder="Nike" value={form.brand} onChange={(e) => set("brand", e.target.value)} required />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Modelo</label>
          <input className={inputCls} placeholder="Air Force 1" value={form.model} onChange={(e) => set("model", e.target.value)} required />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Colorway</label>
          <input className={inputCls} placeholder="White/White" value={form.colorway} onChange={(e) => set("colorway", e.target.value)} required />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Estado</label>
          <select className={inputCls} value={form.status} onChange={(e) => set("status", e.target.value)}>
            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Precio de compra ($)</label>
          <input className={inputCls} type="number" min="0" step="0.01" placeholder="0.00" value={form.purchasePrice} onChange={(e) => set("purchasePrice", e.target.value)} required />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Precio de venta ($)</label>
          <input className={inputCls} type="number" min="0" step="0.01" placeholder="0.00" value={form.salePrice} onChange={(e) => set("salePrice", e.target.value)} required />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Categoría</label>
          <select className={inputCls} value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
            <option value="">Sin categoría</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Calidad</label>
          <select className={inputCls} value={form.qualityId} onChange={(e) => set("qualityId", e.target.value)}>
            <option value="">Sin calidad</option>
            {qualities.map((q) => <option key={q.id} value={q.id}>{q.name}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">Descripción (opcional)</label>
        <input className={inputCls} placeholder="Notas sobre el producto" value={form.description} onChange={(e) => set("description", e.target.value)} />
      </div>

      {/* Talles */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-medium text-zinc-400">Talles</label>
          <button type="button" onClick={addSize} className="text-xs text-zinc-400 hover:text-zinc-100 transition-colors">
            + Agregar talle
          </button>
        </div>

        {/* Header de columnas si hay algún override */}
        {hasPriceOverride && (
          <div className="grid grid-cols-[1fr_56px_80px_80px_20px] gap-2 mb-1 px-1">
            <span className="text-xs text-zinc-600">Talle</span>
            <span className="text-xs text-zinc-600 text-center">Stock</span>
            <span className="text-xs text-zinc-600 text-center">Compra $</span>
            <span className="text-xs text-zinc-600 text-center">Venta $</span>
            <span />
          </div>
        )}

        <div className="space-y-2">
          {form.sizes.map((s, i) => {
            const hasOverride = s.purchasePrice !== "" || s.salePrice !== "";
            return (
              <div key={i} className="space-y-1">
                <div className={`grid gap-2 items-center ${hasOverride || hasPriceOverride ? "grid-cols-[1fr_56px_80px_80px_20px]" : "grid-cols-[1fr_56px_20px]"}`}>
                  <input
                    className={smallInputCls}
                    placeholder="US 10"
                    value={s.size}
                    onChange={(e) => updateSize(i, "size", e.target.value)}
                    required
                  />
                  <input
                    className={smallInputCls}
                    type="number"
                    min="0"
                    value={s.stock}
                    onChange={(e) => updateSize(i, "stock", parseInt(e.target.value) || 0)}
                  />
                  {(hasOverride || hasPriceOverride) && (
                    <>
                      <input
                        className={smallInputCls}
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder={form.purchasePrice || "—"}
                        value={s.purchasePrice}
                        onChange={(e) => updateSize(i, "purchasePrice", e.target.value)}
                      />
                      <input
                        className={smallInputCls}
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder={form.salePrice || "—"}
                        value={s.salePrice}
                        onChange={(e) => updateSize(i, "salePrice", e.target.value)}
                      />
                    </>
                  )}
                  <button type="button" onClick={() => removeSize(i)} className={`text-zinc-600 hover:text-red-400 transition-colors text-sm ${form.sizes.length === 1 ? "invisible" : ""}`}>✕</button>
                </div>
                {/* Botón para activar precio diferente en este talle */}
                {!hasOverride && !hasPriceOverride && (
                  <button
                    type="button"
                    onClick={() => updateSize(i, "purchasePrice", "")}
                    className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors ml-1"
                  >
                    + Precio diferente para este talle
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {!hasPriceOverride && (
          <button
            type="button"
            onClick={() => updateSize(0, "purchasePrice", " ")}
            className="mt-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            ¿Algún talle tiene precio diferente? →
          </button>
        )}
        {hasPriceOverride && (
          <p className="mt-1.5 text-xs text-zinc-600">Dejá el campo vacío para usar el precio del producto.</p>
        )}
      </div>

      {/* Imágenes */}
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-2">Imágenes (opcional)</label>
        <ImageGallery
          images={form.images}
          onChange={(images) => setForm((f) => ({ ...f, images }))}
        />
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>
      )}

      <button type="submit" disabled={loading} className="w-full rounded-lg bg-white text-zinc-950 font-semibold py-2 text-sm hover:bg-zinc-200 transition-colors disabled:opacity-50">
        {loading ? "Guardando..." : submitLabel}
      </button>
    </form>
  );
}
