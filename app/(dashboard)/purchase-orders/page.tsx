"use client";

import { useState } from "react";
import {
  usePurchaseOrders, useCreatePurchaseOrder,
  useReceivePurchaseOrder, useCancelPurchaseOrder,
} from "@/hooks/usePurchaseOrders";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useProducts } from "@/hooks/useProducts";
import { OrderStatusBadge } from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Pagination from "@/components/ui/Pagination";
import { inputCls, btnPrimary, btnDanger } from "@/lib/styles";
import { getApiError, formatCurrency, formatDate } from "@/lib/utils";
import type { PurchaseOrder } from "@/types";

// ─── Tipos internos del form ──────────────────────────────────────────────────

type ItemRow = { productId: string; size: string; quantity: string; unitCost: string };

function emptyItem(): ItemRow {
  return { productId: "", size: "", quantity: "1", unitCost: "" };
}

// ─── Formulario de nueva orden ────────────────────────────────────────────────

function PurchaseOrderForm({
  onSubmit, loading, error,
}: {
  onSubmit: (d: { supplierId: string; notes: string; items: ItemRow[] }) => void;
  loading: boolean;
  error?: string;
}) {
  const { data: suppliersResult } = useSuppliers(undefined, 1, 200);
  const { data: productsResult } = useProducts({ limit: 200 });
  const suppliers = suppliersResult?.data ?? [];
  const products = productsResult?.data ?? [];

  const [supplierId, setSupplierId] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<ItemRow[]>([emptyItem()]);

  function setItem(i: number, f: keyof ItemRow, v: string) {
    setItems((prev) => prev.map((row, idx) => idx === i ? { ...row, [f]: v } : row));
  }

  function addItem() { setItems((p) => [...p, emptyItem()]); }
  function removeItem(i: number) { setItems((p) => p.filter((_, idx) => idx !== i)); }

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ supplierId, notes, items }); }} className="space-y-5">
      {/* Proveedor */}
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">Proveedor *</label>
        <select className={inputCls} value={supplierId} onChange={(e) => setSupplierId(e.target.value)} required>
          <option value="">Seleccionar proveedor...</option>
          {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {/* Ítems */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-zinc-400">Ítems *</label>
          <button type="button" onClick={addItem} className="text-xs text-zinc-400 hover:text-zinc-100 transition-colors">
            + Agregar ítem
          </button>
        </div>
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-3 space-y-3">
              {/* Producto (opcional) */}
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Producto (opcional)</label>
                <select className={inputCls} value={item.productId} onChange={(e) => setItem(i, "productId", e.target.value)}>
                  <option value="">Sin asignar</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.brand} {p.model} — {p.colorway}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Talle *</label>
                  <input className={inputCls} placeholder="US 10" value={item.size} onChange={(e) => setItem(i, "size", e.target.value)} required />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Cantidad *</label>
                  <input className={inputCls} type="number" min="1" value={item.quantity} onChange={(e) => setItem(i, "quantity", e.target.value)} required />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Costo unit. *</label>
                  <input className={inputCls} type="number" min="0" step="0.01" placeholder="0.00" value={item.unitCost} onChange={(e) => setItem(i, "unitCost", e.target.value)} required />
                </div>
              </div>
              {items.length > 1 && (
                <button type="button" onClick={() => removeItem(i)} className="text-xs text-red-400 hover:text-red-300 transition-colors">
                  Eliminar ítem
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Notas */}
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">Notas</label>
        <input className={inputCls} placeholder="Observaciones..." value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      {error && <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>}
      <button type="submit" disabled={loading} className={`w-full ${btnPrimary}`}>
        {loading ? "Creando..." : "Crear orden"}
      </button>
    </form>
  );
}

// ─── Modal de detalle de orden ────────────────────────────────────────────────

function OrderDetailModal({
  order, onClose, onReceive, onCancel, receivePending, cancelPending,
}: {
  order: PurchaseOrder;
  onClose: () => void;
  onReceive: () => void;
  onCancel: () => void;
  receivePending: boolean;
  cancelPending: boolean;
}) {
  const totalCost = order.items.reduce((s, i) => s + parseFloat(i.unitCost) * i.quantity, 0);

  return (
    <Modal open onClose={onClose} title="Detalle de orden">
      <div className="space-y-5">
        {/* Info general */}
        <div className="rounded-lg bg-zinc-800/50 border border-zinc-700 px-4 py-3 space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-500">Proveedor</span>
            <span className="text-zinc-100 font-medium">{order.supplier.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Estado</span>
            <OrderStatusBadge status={order.status} />
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Fecha</span>
            <span className="text-zinc-100">{formatDate(order.orderedAt)}</span>
          </div>
          {order.receivedAt && (
            <div className="flex justify-between">
              <span className="text-zinc-500">Recibida</span>
              <span className="text-zinc-100">{formatDate(order.receivedAt)}</span>
            </div>
          )}
          {order.notes && (
            <div className="flex justify-between">
              <span className="text-zinc-500">Notas</span>
              <span className="text-zinc-400 text-right max-w-[60%]">{order.notes}</span>
            </div>
          )}
        </div>

        {/* Ítems */}
        <div>
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-2">Ítems</p>
          <div className="rounded-lg border border-zinc-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 text-xs">
                  <th className="text-left px-3 py-2">Producto</th>
                  <th className="text-center px-3 py-2">Talle</th>
                  <th className="text-center px-3 py-2">Cant.</th>
                  <th className="text-right px-3 py-2">Costo unit.</th>
                  <th className="text-right px-3 py-2">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-3 py-2 text-zinc-300">
                      {item.product
                        ? `${item.product.brand} ${item.product.model}`
                        : <span className="text-zinc-500 italic">Sin asignar</span>}
                    </td>
                    <td className="px-3 py-2 text-center text-zinc-400">{item.size}</td>
                    <td className="px-3 py-2 text-center text-zinc-400">{item.quantity}</td>
                    <td className="px-3 py-2 text-right text-zinc-300">{formatCurrency(item.unitCost)}</td>
                    <td className="px-3 py-2 text-right font-medium">
                      {formatCurrency(parseFloat(item.unitCost) * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-zinc-700">
                  <td colSpan={4} className="px-3 py-2 text-right text-xs text-zinc-500 uppercase tracking-wide">Total</td>
                  <td className="px-3 py-2 text-right font-bold text-zinc-100">{formatCurrency(totalCost)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Acciones */}
        {order.status === "PENDING" && (
          <div className="flex gap-3 pt-1">
            <button
              onClick={onReceive}
              disabled={receivePending}
              className={`flex-1 ${btnPrimary} py-2`}
            >
              {receivePending ? "Procesando..." : "✓ Marcar como recibida"}
            </button>
            <button
              onClick={onCancel}
              disabled={cancelPending}
              className={`flex-1 ${btnDanger} py-2`}
            >
              {cancelPending ? "Cancelando..." : "Cancelar orden"}
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ─── Página principal ────────────────────────────────────��────────────────────

export default function PurchaseOrdersPage() {
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailOrder, setDetailOrder] = useState<PurchaseOrder | null>(null);
  const [confirmReceive, setConfirmReceive] = useState(false);
  const [formError, setFormError] = useState("");

  const { data: result, isLoading } = usePurchaseOrders(undefined, page, 20);
  const orders = result?.data ?? [];

  const createOrder = useCreatePurchaseOrder();
  const receiveOrder = useReceivePurchaseOrder();
  const cancelOrder = useCancelPurchaseOrder();

  async function handleCreate(form: { supplierId: string; notes: string; items: ItemRow[] }) {
    setFormError("");
    try {
      await createOrder.mutateAsync({
        supplierId: form.supplierId,
        notes: form.notes || undefined,
        items: form.items.map((i) => ({
          productId: i.productId || undefined,
          size: i.size,
          quantity: parseInt(i.quantity),
          unitCost: parseFloat(i.unitCost),
        })),
      });
      setCreateOpen(false);
    } catch (e) {
      setFormError(getApiError(e));
    }
  }

  async function handleReceive() {
    if (!detailOrder) return;
    await receiveOrder.mutateAsync(detailOrder.id);
    setConfirmReceive(false);
    setDetailOrder(null);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Órdenes de compra</h1>
          <p className="text-sm text-zinc-400 mt-0.5">{result?.total ?? 0} órdenes</p>
        </div>
        <button onClick={() => { setFormError(""); setCreateOpen(true); }} className={`px-4 py-2 ${btnPrimary}`}>
          + Nueva orden
        </button>
      </div>

      {/* Lista */}
      {isLoading ? (
        <p className="text-zinc-400 text-sm">Cargando...</p>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">
          <p className="text-4xl mb-3">📦</p>
          <p className="text-sm">No hay órdenes de compra</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 text-xs uppercase tracking-wide">
                <th className="text-left px-4 py-3">Proveedor</th>
                <th className="text-left px-4 py-3">Estado</th>
                <th className="text-right px-4 py-3">Ítems</th>
                <th className="text-right px-4 py-3">Total</th>
                <th className="text-right px-4 py-3">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {orders.map((order) => {
                const total = order.items.reduce((s, i) => s + parseFloat(i.unitCost) * i.quantity, 0);
                return (
                  <tr
                    key={order.id}
                    onClick={() => setDetailOrder(order)}
                    className="hover:bg-zinc-900/50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 font-medium text-zinc-100">{order.supplier.name}</td>
                    <td className="px-4 py-3"><OrderStatusBadge status={order.status} /></td>
                    <td className="px-4 py-3 text-right text-zinc-400">{order.items.length}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(total)}</td>
                    <td className="px-4 py-3 text-right text-zinc-500 text-xs">{formatDate(order.orderedAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {result && result.totalPages > 1 && (
        <Pagination page={result.page} totalPages={result.totalPages} total={result.total} limit={20} onPageChange={setPage} />
      )}

      {/* Modales */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nueva orden de compra">
        <PurchaseOrderForm onSubmit={handleCreate} loading={createOrder.isPending} error={formError} />
      </Modal>

      {detailOrder && (
        <OrderDetailModal
          order={detailOrder}
          onClose={() => setDetailOrder(null)}
          onReceive={() => setConfirmReceive(true)}
          onCancel={async () => { await cancelOrder.mutateAsync(detailOrder.id); setDetailOrder(null); }}
          receivePending={receiveOrder.isPending}
          cancelPending={cancelOrder.isPending}
        />
      )}

      <ConfirmDialog
        open={confirmReceive}
        title="Confirmar recepción"
        description="Al marcar como recibida se actualizará el stock de todos los productos asignados. Esta acción no se puede deshacer."
        confirmLabel="Confirmar recepción"
        loading={receiveOrder.isPending}
        onConfirm={handleReceive}
        onCancel={() => setConfirmReceive(false)}
      />
    </div>
  );
}
