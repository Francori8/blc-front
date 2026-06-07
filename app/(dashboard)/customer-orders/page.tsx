"use client";

import { useState } from "react";
import {
  useCustomerOrders,
  useCreateCustomerOrder,
  useDeliverItem,
  useReserveItem,
  useCancelCustomerOrder,
  usePendingItems,
} from "@/hooks/useCustomerOrders";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Pagination from "@/components/ui/Pagination";
import CustomerOrderForm from "@/components/customer-orders/CustomerOrderForm";
import { getApiError, formatDate, formatCurrency } from "@/lib/utils";
import type { CustomerOrder, CustomerOrderItem, PendingItem } from "@/types";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendiente",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
};

const ITEM_STATUS_LABEL: Record<string, string> = {
  RESERVED: "Reservado",
  PENDING: "A conseguir",
  DELIVERED: "Entregado",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-400/10 text-amber-400 border-amber-400/20",
  DELIVERED: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
  CANCELLED: "bg-zinc-700/50 text-zinc-500 border-zinc-700",
};

const ITEM_STATUS_COLORS: Record<string, string> = {
  RESERVED: "bg-blue-400/10 text-blue-400 border-blue-400/20",
  PENDING: "bg-amber-400/10 text-amber-400 border-amber-400/20",
  DELIVERED: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
};

// ─── Detalle expandible de un pedido ─────────────────────────────────────────

function OrderDetail({ order }: { order: CustomerOrder }) {
  const deliver = useDeliverItem(order.id);
  const reserve = useReserveItem(order.id);

  return (
    <div className="space-y-2">
      {order.items.map((item: CustomerOrderItem) => (
        <div key={item.id} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
          <div>
            <p className="text-sm font-medium text-zinc-100">
              {item.product.brand} {item.product.model} {item.product.colorway}
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">Talle {item.size} · {formatCurrency(item.salePrice)}</p>
          </div>
          <div className="flex items-center gap-2 ml-4 shrink-0">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${ITEM_STATUS_COLORS[item.status]}`}>
              {ITEM_STATUS_LABEL[item.status]}
            </span>
            {item.status === "PENDING" && order.status === "PENDING" && (
              <button
                onClick={() => reserve.mutate(item.id)}
                disabled={reserve.isPending}
                className="text-xs text-zinc-400 hover:text-blue-400 transition-colors px-2 py-1 rounded hover:bg-zinc-800"
              >
                Reservar
              </button>
            )}
            {item.status === "RESERVED" && order.status === "PENDING" && (
              <button
                onClick={() => deliver.mutate(item.id)}
                disabled={deliver.isPending}
                className="text-xs text-zinc-400 hover:text-emerald-400 transition-colors px-2 py-1 rounded hover:bg-zinc-800"
              >
                Entregar
              </button>
            )}
          </div>
        </div>
      ))}
      {order.notes && (
        <p className="text-xs text-zinc-500 pt-1">📝 {order.notes}</p>
      )}
    </div>
  );
}

// ─── Tab: zapatillas a conseguir ──────────────────────────────────────────────

function PendingItemsTab() {
  const { data: pendingItems = [], isLoading } = usePendingItems();

  if (isLoading) return <p className="text-zinc-400 text-sm">Cargando...</p>;

  if (pendingItems.length === 0) {
    return (
      <div className="text-center py-16 text-zinc-500">
        <p className="text-4xl mb-3">✅</p>
        <p className="text-sm">No hay zapatillas pendientes de conseguir</p>
      </div>
    );
  }

  // Agrupar por producto + talle
  const grouped = pendingItems.reduce<Record<string, { item: PendingItem; clients: string[] }>>((acc, item) => {
    const key = `${item.productId}-${item.size}`;
    if (!acc[key]) {
      acc[key] = { item, clients: [] };
    }
    acc[key].clients.push(item.customerOrder.client.name);
    return acc;
  }, {});

  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-400">{pendingItems.length} item{pendingItems.length !== 1 ? "s" : ""} por conseguir</p>
      <div className="grid gap-3">
        {Object.values(grouped).map(({ item, clients }) => (
          <div key={`${item.productId}-${item.size}`} className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-zinc-100">
                  {item.product.brand} {item.product.model} {item.product.colorway}
                </p>
                <p className="text-sm text-zinc-400 mt-0.5">Talle {item.size}</p>
              </div>
              <div className="text-right shrink-0 ml-4">
                <p className="text-sm font-semibold text-amber-400">{clients.length}x pedido{clients.length !== 1 ? "s" : ""}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{clients.join(", ")}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function CustomerOrdersPage() {
  const [tab, setTab] = useState<"orders" | "pending">("orders");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [createError, setCreateError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [cancelOrder, setCancelOrder] = useState<CustomerOrder | null>(null);

  const { data: result, isLoading } = useCustomerOrders(
    undefined,
    statusFilter || undefined,
    page,
    20,
  );
  const orders: CustomerOrder[] = result?.data ?? [];

  const createOrder = useCreateCustomerOrder();
  const cancelMutation = useCancelCustomerOrder();

  async function handleCreate(form: unknown) {
    setCreateError("");
    try {
      await createOrder.mutateAsync(form);
      setCreateOpen(false);
    } catch (e) {
      setCreateError(getApiError(e));
    }
  }

  async function handleCancel() {
    if (!cancelOrder) return;
    try {
      await cancelMutation.mutateAsync(cancelOrder.id);
    } finally {
      setCancelOrder(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pedidos</h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            {tab === "orders" ? `${result?.total ?? 0} pedidos` : "Zapatillas a conseguir"}
          </p>
        </div>
        <button
          onClick={() => { setCreateOpen(true); setCreateError(""); }}
          className="rounded-lg bg-white text-zinc-950 px-4 py-2 text-sm font-semibold hover:bg-zinc-200 transition-colors"
        >
          + Nuevo pedido
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-zinc-800">
        {(["orders", "pending"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t
                ? "border-white text-zinc-100"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {t === "orders" ? "Pedidos" : "A conseguir"}
          </button>
        ))}
      </div>

      {tab === "pending" ? (
        <PendingItemsTab />
      ) : (
        <>
          {/* Filtro de estado */}
          <div className="flex gap-2 flex-wrap">
            {["", "PENDING", "DELIVERED", "CANCELLED"].map((s) => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1); }}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors border ${
                  statusFilter === s
                    ? "bg-white text-zinc-950 border-white"
                    : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
                }`}
              >
                {s === "" ? "Todos" : STATUS_LABEL[s]}
              </button>
            ))}
          </div>

          {isLoading ? (
            <p className="text-zinc-400 text-sm">Cargando...</p>
          ) : orders.length === 0 ? (
            <div className="text-center py-16 text-zinc-500">
              <p className="text-4xl mb-3">📦</p>
              <p className="text-sm">No hay pedidos</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {orders.map((order: CustomerOrder) => (
                <div key={order.id} className="rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 transition-colors">
                  <div className="flex items-center justify-between px-5 py-4">
                    <button
                      className="flex-1 text-left"
                      onClick={() => setExpanded(order.id === expanded ? null : order.id)}
                    >
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-zinc-100">{order.client.name}</p>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${STATUS_COLORS[order.status]}`}>
                          {STATUS_LABEL[order.status]}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {order.items.length} item{order.items.length !== 1 ? "s" : ""} · {formatDate(order.createdAt)}
                      </p>
                    </button>
                    <div className="flex items-center gap-2 ml-4 shrink-0">
                      {order.status === "PENDING" && (
                        <button
                          onClick={() => setCancelOrder(order)}
                          className="text-xs text-zinc-600 hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-zinc-800"
                        >
                          Cancelar
                        </button>
                      )}
                      <span className="text-zinc-600 text-xs">
                        {expanded === order.id ? "▲" : "▼"}
                      </span>
                    </div>
                  </div>

                  {expanded === order.id && (
                    <div className="px-5 pb-5 border-t border-zinc-800 pt-4">
                      <OrderDetail order={order} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {result && result.totalPages > 1 && (
            <Pagination
              page={result.page}
              totalPages={result.totalPages}
              total={result.total}
              limit={20}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nuevo pedido">
        <CustomerOrderForm
          key={createOpen ? "open" : "closed"}
          onSubmit={handleCreate}
          loading={createOrder.isPending}
          error={createError}
        />
      </Modal>

      <ConfirmDialog
        open={!!cancelOrder}
        title="Cancelar pedido"
        description={cancelOrder ? `¿Cancelar el pedido de "${cancelOrder.client.name}"? Se restaurará el stock reservado.` : ""}
        confirmLabel="Cancelar pedido"
        loading={cancelMutation.isPending}
        onConfirm={handleCancel}
        onCancel={() => setCancelOrder(null)}
      />
    </div>
  );
}
