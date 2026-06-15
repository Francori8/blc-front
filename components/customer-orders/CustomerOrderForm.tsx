"use client";

import { useState } from "react";
import { inputCls, btnPrimary } from "@/lib/styles";
import { useClients } from "@/hooks/useClients";
import { useProducts } from "@/hooks/useProducts";
import type { Client, Product } from "@/types";

interface OrderItemDraft {
  productId: string;
  size: string;
  salePrice: string;
  // para mostrar en UI
  productLabel: string;
  availableSizes: string[];
}

interface CustomerOrderFormData {
  clientId: string;
  notes: string;
  items: { productId: string; size: string; salePrice: number }[];
}

interface Props {
  onSubmit: (data: CustomerOrderFormData) => void;
  loading: boolean;
  error?: string;
}

export default function CustomerOrderForm({ onSubmit, loading, error }: Props) {
  const [clientSearch, setClientSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [clientId, setClientId] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<OrderItemDraft[]>([]);

  const { data: clientsResult } = useClients(clientSearch || undefined, 1, 10);
  const { data: productsResult } = useProducts({ page: 1, limit: 50 });

  const clients: Client[] = clientsResult?.data ?? [];
  const products: Product[] = productsResult?.data ?? [];

  const selectedClient = clients.find((c) => c.id === clientId);

  function addItem(product: Product) {
    if (items.find((i) => i.productId === product.id)) return;
    const availableSizes = product.sizes.map((s) => s.size);
    if (availableSizes.length === 0) return;
    setItems((prev) => [
      ...prev,
      {
        productId: product.id,
        size: availableSizes[0],
        salePrice: product.salePrice,
        productLabel: `${product.brand} ${product.model} ${product.colorway}`,
        availableSizes,
      },
    ]);
    setProductSearch("");
  }

  function updateItem(productId: string, field: "size" | "salePrice", value: string) {
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, [field]: value } : i))
    );
  }

  function removeItem(productId: string) {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      clientId,
      notes,
      items: items.map((i) => ({
        productId: i.productId,
        size: i.size,
        salePrice: parseFloat(i.salePrice) || 0,
      })),
    });
  }

  const filteredProducts = products.filter((p) =>
    productSearch
      ? `${p.brand} ${p.model} ${p.colorway}`.toLowerCase().includes(productSearch.toLowerCase())
      : false
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Cliente */}
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">Cliente</label>
        {selectedClient ? (
          <div className="flex items-center justify-between rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2">
            <span className="text-sm text-zinc-100">{selectedClient.name}</span>
            <button
              type="button"
              onClick={() => { setClientId(""); setClientSearch(""); }}
              className="text-xs text-zinc-500 hover:text-zinc-300"
            >
              Cambiar
            </button>
          </div>
        ) : (
          <div className="relative">
            <input
              className={inputCls}
              placeholder="Buscar cliente..."
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
            />
            {clients.length > 0 && clientSearch && (
              <div className="absolute z-10 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl max-h-40 overflow-y-auto">
                {clients.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => { setClientId(c.id); setClientSearch(""); }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-700 text-zinc-100"
                  >
                    {c.name}
                    {c.instagram && <span className="text-zinc-500 ml-2">@{c.instagram}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Productos */}
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">Zapatillas</label>
        <div className="relative">
          <input
            className={inputCls}
            placeholder="Buscar zapatilla para agregar..."
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
          />
          {filteredProducts.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
              {filteredProducts.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => addItem(p)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-700 text-zinc-100"
                >
                  <span>{p.brand} {p.model} {p.colorway}</span>
                  <span className={`ml-2 text-xs ${p.status === "IN_STOCK" ? "text-emerald-400" : "text-amber-400"}`}>
                    {p.status === "IN_STOCK" ? "En stock" : p.status === "ON_REQUEST" ? "A pedido" : "Sin stock"}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="mt-3 space-y-2">
            {items.map((item) => (
              <div key={item.productId} className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-zinc-100">{item.productLabel}</p>
                  <button
                    type="button"
                    onClick={() => removeItem(item.productId)}
                    className="text-xs text-zinc-600 hover:text-red-400"
                  >
                    Quitar
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Talle</label>
                    <select
                      className={inputCls}
                      value={item.size}
                      onChange={(e) => updateItem(item.productId, "size", e.target.value)}
                    >
                      {item.availableSizes.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Precio venta</label>
                    <input
                      className={inputCls}
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.salePrice}
                      onChange={(e) => updateItem(item.productId, "salePrice", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notas */}
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">Notas</label>
        <input
          className={inputCls}
          placeholder="Ej: pidió por IG el lunes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading || !clientId || items.length === 0}
        className={`w-full ${btnPrimary}`}
      >
        {loading ? "Creando..." : "Crear pedido"}
      </button>
    </form>
  );
}
