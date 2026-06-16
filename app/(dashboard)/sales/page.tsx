"use client";

import { useState } from "react";
import { useSales, useCreateSale, useUpdateSale, useDeleteSale, useProfitReport } from "@/hooks/useSales";
import { useCreateClient } from "@/hooks/useClients";
import { useProducts } from "@/hooks/useProducts";
import { useClients } from "@/hooks/useClients";
import { useSaleSources } from "@/hooks/useCatalog";
import { useQueryClient } from "@tanstack/react-query";
import { PaymentBadge } from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import ClientForm from "@/components/clients/ClientForm";
import Pagination from "@/components/ui/Pagination";
import { getApiError, formatCurrency, formatDate } from "@/lib/utils";
import type { PaymentMethod, Sale } from "@/types";

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "CASH",        label: "Efectivo" },
  { value: "TRANSFER",    label: "Transferencia" },
  { value: "MERCADOPAGO", label: "MercadoPago" },
];

function todayLocal() {
  return new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD en zona local
}

function SaleForm({
  onSubmit, loading, error,
}: {
  onSubmit: (d: { productSizeId: string; clientId: string; salePrice: string; paymentMethod: PaymentMethod; saleSourceId: string; notes: string; soldAt: string }) => void;
  loading: boolean;
  error?: string;
}) {
  const { data: productsResult } = useProducts({ status: "IN_STOCK", limit: 200 });
  const { data: clientsResult } = useClients(undefined, 1, 200);
  const { data: saleSources = [] } = useSaleSources();
  const products = productsResult?.data ?? [];
  const clients = clientsResult?.data ?? [];
  const [productId, setProductId] = useState("");
  const [form, setForm] = useState({
    productSizeId: "",
    clientId: "",
    salePrice: "",
    paymentMethod: "CASH" as PaymentMethod,
    saleSourceId: "",
    notes: "",
    soldAt: todayLocal(),
  });
  const [newClientOpen, setNewClientOpen] = useState(false);
  const [newClientError, setNewClientError] = useState("");
  const createClient = useCreateClient();
  const qc = useQueryClient();

  const selectedProduct = products.find((p) => p.id === productId);

  function set<K extends keyof typeof form>(f: K, v: typeof form[K]) {
    setForm((p) => ({ ...p, [f]: v }));
  }

  const inputCls = "w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20";

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      {/* Producto */}
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">Producto</label>
        <select className={inputCls} value={productId} onChange={(e) => { setProductId(e.target.value); set("productSizeId", ""); }} required>
          <option value="">Seleccionar producto...</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.brand} {p.model} — {p.colorway}
            </option>
          ))}
        </select>
      </div>

      {/* Talle */}
      {selectedProduct && (
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Talle</label>
          <select className={inputCls} value={form.productSizeId} onChange={(e) => set("productSizeId", e.target.value)} required>
            <option value="">Seleccionar talle...</option>
            {selectedProduct.sizes.filter((s) => s.stock > 0).map((s) => (
              <option key={s.id} value={s.id}>{s.size} ({s.stock} unid.)</option>
            ))}
          </select>
          {form.productSizeId && (() => {
            const selectedSize = selectedProduct.sizes.find((s) => s.id === form.productSizeId);
            const suggestedSale = selectedSize?.salePrice
              ? parseFloat(selectedSize.salePrice)
              : parseFloat(selectedProduct.salePrice);
            const suggestedCost = selectedSize?.purchasePrice
              ? parseFloat(selectedSize.purchasePrice)
              : parseFloat(selectedProduct.purchasePrice);
            const hasSizeOverride = !!selectedSize?.salePrice || !!selectedSize?.purchasePrice;
            return (
              <div className="mt-1 flex gap-3 text-xs text-zinc-500">
                <span>Venta sugerida: <span className="text-zinc-300">${suggestedSale.toLocaleString("es-AR")}</span></span>
                <span>Costo: <span className="text-zinc-400">${suggestedCost.toLocaleString("es-AR")}</span></span>
                {hasSizeOverride && <span className="text-yellow-500">precio específico del talle</span>}
              </div>
            );
          })()}
        </div>
      )}

      {/* Cliente */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-medium text-zinc-400">Cliente</label>
          <button
            type="button"
            onClick={() => { setNewClientError(""); setNewClientOpen(true); }}
            className="text-xs text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            + Nuevo cliente
          </button>
        </div>
        <select className={inputCls} value={form.clientId} onChange={(e) => set("clientId", e.target.value)} required>
          <option value="">Seleccionar cliente...</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}{c.instagram ? ` (@${c.instagram})` : ""}
            </option>
          ))}
        </select>
      </div>

      <Modal open={newClientOpen} onClose={() => setNewClientOpen(false)} title="Nuevo cliente">
        <ClientForm
          loading={createClient.isPending}
          error={newClientError}
          submitLabel="Crear cliente"
          onSubmit={async (data) => {
            setNewClientError("");
            try {
              const newClient = await createClient.mutateAsync(data);
              await qc.invalidateQueries({ queryKey: ["clients"] });
              set("clientId", newClient.id);
              setNewClientOpen(false);
            } catch (e: unknown) {
              setNewClientError(getApiError(e));
            }
          }}
        />
      </Modal>

      <div className="grid grid-cols-2 gap-4">
        {/* Precio real */}
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Precio de venta ($)</label>
          <input
            className={inputCls}
            type="number" min="0" step="0.01"
            placeholder={selectedProduct ? parseFloat(selectedProduct.salePrice).toString() : "0.00"}
            value={form.salePrice}
            onChange={(e) => set("salePrice", e.target.value)}
            required
          />
        </div>
        {/* Método de pago */}
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Método de pago</label>
          <select className={inputCls} value={form.paymentMethod} onChange={(e) => set("paymentMethod", e.target.value as PaymentMethod)}>
            {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
      </div>

      {saleSources.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Canal de contacto (opcional)</label>
          <select className={inputCls} value={form.saleSourceId} onChange={(e) => set("saleSourceId", e.target.value)}>
            <option value="">Sin especificar</option>
            {saleSources.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Notas (opcional)</label>
          <input className={inputCls} placeholder="Observaciones..." value={form.notes} onChange={(e) => set("notes", e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Fecha</label>
          <input className={inputCls} type="date" value={form.soldAt} onChange={(e) => set("soldAt", e.target.value)} required />
        </div>
      </div>

      {error && <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>}
      <button type="submit" disabled={loading} className="w-full rounded-lg bg-white text-zinc-950 font-semibold py-2 text-sm hover:bg-zinc-200 transition-colors disabled:opacity-50">
        {loading ? "Registrando..." : "Registrar venta"}
      </button>
    </form>
  );
}

function EditSaleForm({ sale, onClose, error }: { sale: Sale; onClose: () => void; error?: string }) {
  const update = useUpdateSale(sale.id);
  const { data: saleSources = [] } = useSaleSources();
  const inputCls = "w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20";
  const [form, setForm] = useState({
    salePrice: parseFloat(sale.salePrice).toString(),
    paymentMethod: sale.paymentMethod as PaymentMethod,
    saleSourceId: sale.saleSource?.id ?? "",
    notes: sale.notes ?? "",
    soldAt: new Date(sale.soldAt).toLocaleDateString("en-CA"),
  });
  const [localError, setLocalError] = useState("");

  function set<K extends keyof typeof form>(f: K, v: typeof form[K]) {
    setForm((p) => ({ ...p, [f]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError("");
    try {
      await update.mutateAsync({
        salePrice: parseFloat(form.salePrice),
        paymentMethod: form.paymentMethod,
        saleSourceId: form.saleSourceId || null,
        notes: form.notes || null,
        soldAt: form.soldAt,
      });
      onClose();
    } catch (e: unknown) {
      setLocalError(getApiError(e));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-lg bg-zinc-800/50 border border-zinc-700 px-4 py-3 text-sm text-zinc-400">
        {sale.productSize.product.brand} {sale.productSize.product.model} · Talle {sale.productSize.size} · {sale.client.name}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Precio de venta ($)</label>
          <input className={inputCls} type="number" min="0" step="0.01" value={form.salePrice} onChange={(e) => set("salePrice", e.target.value)} required />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Método de pago</label>
          <select className={inputCls} value={form.paymentMethod} onChange={(e) => set("paymentMethod", e.target.value as PaymentMethod)}>
            {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Canal de contacto</label>
          <select className={inputCls} value={form.saleSourceId} onChange={(e) => set("saleSourceId", e.target.value)}>
            <option value="">Sin especificar</option>
            {saleSources.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Fecha</label>
          <input className={inputCls} type="date" value={form.soldAt} onChange={(e) => set("soldAt", e.target.value)} required />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">Notas</label>
        <input className={inputCls} placeholder="Observaciones..." value={form.notes} onChange={(e) => set("notes", e.target.value)} />
      </div>
      {(localError || error) && <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{localError || error}</p>}
      <button type="submit" disabled={update.isPending} className="w-full rounded-lg bg-white text-zinc-950 font-semibold py-2 text-sm hover:bg-zinc-200 transition-colors disabled:opacity-50">
        {update.isPending ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-5 py-4">
      <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {sub && <p className="text-xs text-zinc-500 mt-0.5">{sub}</p>}
    </div>
  );
}

function SaleDetailModal({ sale, onClose, onDelete, onEdit }: { sale: Sale; onClose: () => void; onDelete: () => void; onEdit: () => void }) {
  const gain = parseFloat(sale.salePrice) - parseFloat(sale.purchasePrice);
  const margin = parseFloat(sale.salePrice) > 0
    ? ((gain / parseFloat(sale.salePrice)) * 100).toFixed(1)
    : "0";

  const rows: { label: string; value: string; highlight?: string }[] = [
    { label: "Precio de venta", value: formatCurrency(sale.salePrice) },
    { label: "Costo",           value: formatCurrency(sale.purchasePrice) },
    { label: "Ganancia",        value: `${formatCurrency(gain)} (${margin}%)`, highlight: gain >= 0 ? "text-emerald-400" : "text-red-400" },
  ];

  return (
    <Modal open onClose={onClose} title="Detalle de venta">
      <div className="space-y-5">
        {/* Producto */}
        <div className="rounded-lg bg-zinc-800/50 border border-zinc-700 px-4 py-3">
          <p className="font-semibold text-zinc-100">
            {sale.productSize.product.brand} {sale.productSize.product.model}
          </p>
          <p className="text-sm text-zinc-400 mt-0.5">
            {sale.productSize.product.colorway} · Talle {sale.productSize.size}
          </p>
        </div>

        {/* Números */}
        <div className="grid grid-cols-3 gap-3">
          {rows.map(({ label, value, highlight }) => (
            <div key={label} className="rounded-lg bg-zinc-800/50 border border-zinc-700 px-3 py-3 text-center">
              <p className="text-xs text-zinc-500 mb-1">{label}</p>
              <p className={`text-sm font-semibold ${highlight ?? "text-zinc-100"}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Info */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-500">Cliente</span>
            <span className="text-zinc-100">
              {sale.client.name}
              {sale.client.instagram && <span className="text-zinc-500 ml-1">@{sale.client.instagram}</span>}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Método de pago</span>
            <PaymentBadge method={sale.paymentMethod} />
          </div>
          {sale.saleSource && (
            <div className="flex justify-between">
              <span className="text-zinc-500">Canal de contacto</span>
              <span className="text-zinc-100">{sale.saleSource.name}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-zinc-500">Vendedor</span>
            <span className="text-zinc-100">{sale.user.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Fecha</span>
            <span className="text-zinc-100">{formatDate(sale.soldAt)}</span>
          </div>
          {sale.notes && (
            <div className="flex justify-between">
              <span className="text-zinc-500">Notas</span>
              <span className="text-zinc-100 text-right max-w-[60%]">{sale.notes}</span>
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="pt-1 flex gap-2">
          <button
            onClick={onEdit}
            className="flex-1 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 font-semibold py-2 text-sm hover:bg-zinc-700 transition-colors"
          >
            Editar
          </button>
          <button
            onClick={onDelete}
            className="flex-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 font-semibold py-2 text-sm hover:bg-red-500/20 transition-colors"
          >
            Eliminar
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function SalesPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [restoreStock, setRestoreStock] = useState(true);
  const [detailSale, setDetailSale] = useState<Sale | null>(null);
  const [editSale, setEditSale] = useState<Sale | null>(null);

  const { data: result, isLoading } = useSales({ page, limit: 20 });
  const sales = result?.data ?? [];
  const { data: report } = useProfitReport();
  const createSale = useCreateSale();
  const deleteSale = useDeleteSale();

  async function handleCreate(form: {
    productSizeId: string; clientId: string; salePrice: string;
    paymentMethod: PaymentMethod; saleSourceId: string; notes: string; soldAt: string;
  }) {
    setFormError("");
    try {
      await createSale.mutateAsync({
        ...form,
        salePrice: parseFloat(form.salePrice),
        saleSourceId: form.saleSourceId || undefined,
        soldAt: form.soldAt || undefined,
      });
      setModalOpen(false);
    } catch (e: unknown) {
      setFormError(getApiError(e));
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ventas</h1>
          <p className="text-sm text-zinc-400 mt-0.5">{result?.total ?? 0} ventas registradas</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              const { data } = await import("@/lib/api").then(m => m.api.get("/sales/export/csv", { responseType: "blob" }));
              const url = URL.createObjectURL(data);
              const a = document.createElement("a");
              a.href = url;
              a.download = "ventas.csv";
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="rounded-lg border border-zinc-700 text-zinc-400 px-4 py-2 text-sm font-medium hover:text-zinc-100 hover:border-zinc-500 transition-colors"
          >
            ↓ CSV
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="rounded-lg bg-white text-zinc-950 px-4 py-2 text-sm font-semibold hover:bg-zinc-200 transition-colors"
          >
            + Nueva venta
          </button>
        </div>
      </div>

      {/* Stats */}
      {report && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Ventas" value={report.totalSales.toString()} />
          <StatCard label="Ingresos" value={formatCurrency(report.totalRevenue)} />
          <StatCard label="Costo" value={formatCurrency(report.totalCost)} />
          <StatCard
            label="Ganancia"
            value={formatCurrency(report.totalProfit)}
            sub={`Margen ${report.margin}`}
          />
        </div>
      )}

      {/* Lista */}
      {isLoading ? (
        <p className="text-zinc-400 text-sm">Cargando...</p>
      ) : sales.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">
          <p className="text-4xl mb-3">💸</p>
          <p className="text-sm">No hay ventas registradas</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 text-xs uppercase tracking-wide">
                <th className="text-left px-4 py-3">Producto</th>
                <th className="text-left px-4 py-3">Cliente</th>
                <th className="text-left px-4 py-3">Pago</th>
                <th className="text-right px-4 py-3">Precio</th>
                <th className="text-right px-4 py-3">Ganancia</th>
                <th className="text-right px-4 py-3">Fecha</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {sales.map((sale) => {
                const gain = parseFloat(sale.salePrice) - parseFloat(sale.purchasePrice);
                return (
                  <tr key={sale.id} onClick={() => setDetailSale(sale)} className="hover:bg-zinc-900/50 transition-colors cursor-pointer">
                    <td className="px-4 py-3">
                      <p className="font-medium text-zinc-100">
                        {sale.productSize.product.brand} {sale.productSize.product.model}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {sale.productSize.product.colorway} · {sale.productSize.size}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-zinc-100">{sale.client.name}</p>
                      {sale.client.instagram && (
                        <p className="text-xs text-zinc-500">@{sale.client.instagram}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <PaymentBadge method={sale.paymentMethod} />
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatCurrency(sale.salePrice)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={gain >= 0 ? "text-emerald-400" : "text-red-400"}>
                        {formatCurrency(gain)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-500 text-xs">
                      {formatDate(sale.soldAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); setRestoreStock(true); setDeleteId(sale.id); }}
                        className="text-zinc-600 hover:text-red-400 transition-colors"
                        title="Eliminar venta"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginación */}
      {result && result.totalPages > 1 && (
        <Pagination
          page={result.page}
          totalPages={result.totalPages}
          total={result.total}
          limit={20}
          onPageChange={setPage}
        />
      )}

      {detailSale && (
        <SaleDetailModal
          sale={detailSale}
          onClose={() => setDetailSale(null)}
          onDelete={() => { setRestoreStock(true); setDeleteId(detailSale.id); setDetailSale(null); }}
          onEdit={() => { setEditSale(detailSale); setDetailSale(null); }}
        />
      )}

      {editSale && (
        <Modal open onClose={() => setEditSale(null)} title="Editar venta">
          <EditSaleForm sale={editSale} onClose={() => setEditSale(null)} />
        </Modal>
      )}

      {/* Diálogo eliminar venta */}
      {deleteId && (
        <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Eliminar venta">
          <div className="space-y-4">
            <p className="text-sm text-zinc-300">¿Seguro que querés eliminar esta venta?</p>

            <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-zinc-700 px-4 py-3 hover:border-zinc-500 transition-colors">
              <input
                type="checkbox"
                checked={restoreStock}
                onChange={(e) => setRestoreStock(e.target.checked)}
                className="mt-0.5 accent-white"
              />
              <div>
                <p className="text-sm text-zinc-100 font-medium">Restaurar stock</p>
                <p className="text-xs text-zinc-500 mt-0.5">Devuelve +1 unidad al talle correspondiente</p>
              </div>
            </label>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 rounded-lg border border-zinc-700 text-zinc-400 py-2 text-sm hover:text-zinc-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                disabled={deleteSale.isPending}
                onClick={async () => {
                  await deleteSale.mutateAsync({ id: deleteId, restoreStock });
                  setDeleteId(null);
                }}
                className="flex-1 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 font-semibold py-2 text-sm hover:bg-red-500/30 transition-colors disabled:opacity-50"
              >
                {deleteSale.isPending ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setFormError(""); }} title="Nueva venta">
        <SaleForm onSubmit={handleCreate} loading={createSale.isPending} error={formError} />
      </Modal>
    </div>
  );
}
