"use client";

import { useState } from "react";
import { useClients, useClient, useCreateClient, useUpdateClient, useDeleteClient } from "@/hooks/useClients";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Pagination from "@/components/ui/Pagination";
import ClientForm from "@/components/clients/ClientForm";
import { PaymentBadge } from "@/components/ui/Badge";
import { getApiError, formatDate, formatCurrency } from "@/lib/utils";
import type { Client, Sale } from "@/types";

// ─── Historial expandible ─────────────────────────────────────────────────────

function ClientHistory({ clientId }: { clientId: string }) {
  const { data: client, isLoading } = useClient(clientId);

  if (isLoading) {
    return <p className="text-xs text-zinc-500 py-2">Cargando historial...</p>;
  }

  const sales: Sale[] = (client as (Client & { sales: Sale[] }) | undefined)?.sales ?? [];

  const totalSpent = sales.reduce((s, sale) => s + parseFloat(sale.salePrice), 0);
  const totalGain  = sales.reduce((s, sale) => s + parseFloat(sale.salePrice) - parseFloat(sale.purchasePrice), 0);

  const methodCount = sales.reduce<Record<string, number>>((acc, sale) => {
    acc[sale.paymentMethod] = (acc[sale.paymentMethod] ?? 0) + 1;
    return acc;
  }, {});
  const favMethod = Object.entries(methodCount).sort((a, b) => b[1] - a[1])[0]?.[0];

  return (
    <div className="space-y-4">
      {/* Métricas */}
      {sales.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-zinc-800/60 border border-zinc-700 px-3 py-2.5 text-center">
            <p className="text-xs text-zinc-500 mb-0.5">Compras</p>
            <p className="text-lg font-bold">{sales.length}</p>
          </div>
          <div className="rounded-lg bg-zinc-800/60 border border-zinc-700 px-3 py-2.5 text-center">
            <p className="text-xs text-zinc-500 mb-0.5">Total gastado</p>
            <p className="text-sm font-bold text-emerald-400">{formatCurrency(totalSpent)}</p>
          </div>
          <div className="rounded-lg bg-zinc-800/60 border border-zinc-700 px-3 py-2.5 text-center">
            <p className="text-xs text-zinc-500 mb-0.5">Ganancia</p>
            <p className={`text-sm font-bold ${totalGain >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {formatCurrency(totalGain)}
            </p>
          </div>
        </div>
      )}

      {/* Lista de ventas */}
      <div>
        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-2">
          Historial de compras {sales.length > 0 && `(${sales.length})`}
        </p>
        {sales.length === 0 ? (
          <p className="text-xs text-zinc-600">Sin compras registradas</p>
        ) : (
          <div>
            {sales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between py-2.5 border-b border-zinc-800 last:border-0">
                <div>
                  <p className="text-sm font-medium text-zinc-100">
                    {sale.productSize.product.brand} {sale.productSize.product.model}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {sale.productSize.product.colorway} · Talle {sale.productSize.size} · {formatDate(sale.soldAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-4 shrink-0">
                  <PaymentBadge method={sale.paymentMethod} />
                  <span className="text-sm font-semibold">{formatCurrency(sale.salePrice)}</span>
                </div>
              </div>
            ))}
            {favMethod && (
              <p className="text-xs text-zinc-600 mt-2">
                Método favorito: <PaymentBadge method={favMethod as Sale["paymentMethod"]} />
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Wrapper edición ──────────────────────────────────────────────────────────

function EditClientWrapper({ client, onClose }: { client: Client; onClose: () => void }) {
  const [error, setError] = useState("");
  const update = useUpdateClient(client.id);

  async function handleSubmit(form: { name: string; instagram: string; phone: string; notes: string }) {
    setError("");
    try {
      await update.mutateAsync(form);
      onClose();
    } catch (e) {
      setError(getApiError(e));
    }
  }

  return (
    <ClientForm initial={client} onSubmit={handleSubmit} loading={update.isPending} error={error} submitLabel="Guardar cambios" />
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [deleteClient, setDeleteClient] = useState<Client | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [createError, setCreateError] = useState("");

  const { data: result, isLoading } = useClients(search || undefined, page, 20);
  const clients = result?.data ?? [];
  const createClient = useCreateClient();
  const deleteClientMutation = useDeleteClient();

  async function handleCreate(form: { name: string; instagram: string; phone: string; notes: string }) {
    setCreateError("");
    try {
      await createClient.mutateAsync(form);
      setCreateOpen(false);
    } catch (err: unknown) {
      setCreateError(getApiError(err));
    }
  }

  async function handleDelete() {
    if (!deleteClient) return;
    try {
      await deleteClientMutation.mutateAsync(deleteClient.id);
      setDeleteClient(null);
      if (expanded === deleteClient.id) setExpanded(null);
    } catch {
      setDeleteClient(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-sm text-zinc-400 mt-0.5">{result?.total ?? 0} clientes</p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="rounded-lg bg-white text-zinc-950 px-4 py-2 text-sm font-semibold hover:bg-zinc-200 transition-colors"
        >
          + Nuevo cliente
        </button>
      </div>

      <input
        type="text"
        placeholder="Buscar por nombre, Instagram o teléfono..."
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20"
      />

      {isLoading ? (
        <p className="text-zinc-400 text-sm">Cargando...</p>
      ) : clients.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">
          <p className="text-4xl mb-3">👤</p>
          <p className="text-sm">No hay clientes</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {clients.map((client: Client) => (
            <div key={client.id} className="rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 transition-colors">
              <div className="flex items-center justify-between px-5 py-4">
                <button
                  className="flex-1 text-left"
                  onClick={() => setExpanded(client.id === expanded ? null : client.id)}
                >
                  <p className="font-medium text-zinc-100">{client.name}</p>
                  <div className="flex gap-3 mt-0.5">
                    {client.instagram && <span className="text-xs text-zinc-500">@{client.instagram}</span>}
                    {client.phone && <span className="text-xs text-zinc-500">{client.phone}</span>}
                  </div>
                </button>
                <div className="flex items-center gap-2 ml-4">
                  <span className="text-xs text-zinc-600">{formatDate(client.createdAt)}</span>
                  <button
                    onClick={() => setEditClient(client)}
                    className="text-xs text-zinc-400 hover:text-zinc-100 transition-colors px-2 py-1 rounded hover:bg-zinc-800"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => setDeleteClient(client)}
                    className="text-xs text-zinc-600 hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-zinc-800"
                  >
                    Eliminar
                  </button>
                  <span className="text-zinc-600 text-xs">
                    {expanded === client.id ? "▲" : "▼"}
                  </span>
                </div>
              </div>

              {expanded === client.id && (
                <div className="px-5 pb-5 border-t border-zinc-800 pt-4">
                  <ClientHistory clientId={client.id} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {result && result.totalPages > 1 && (
        <Pagination page={result.page} totalPages={result.totalPages} total={result.total} limit={20} onPageChange={setPage} />
      )}

      <Modal open={createOpen} onClose={() => { setCreateOpen(false); setCreateError(""); }} title="Nuevo cliente">
        <ClientForm key={createOpen ? "open" : "closed"} onSubmit={handleCreate} loading={createClient.isPending} error={createError} />
      </Modal>

      <Modal open={!!editClient} onClose={() => setEditClient(null)} title="Editar cliente">
        {editClient && <EditClientWrapper key={editClient.id} client={editClient} onClose={() => setEditClient(null)} />}
      </Modal>

      <ConfirmDialog
        open={!!deleteClient}
        title="Eliminar cliente"
        description={deleteClient ? `¿Eliminar a "${deleteClient.name}"? Esta acción no se puede deshacer.` : ""}
        loading={deleteClientMutation.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteClient(null)}
      />
    </div>
  );
}
