"use client";

import { useState } from "react";
import { useSuppliers, useCreateSupplier, useUpdateSupplier, useDeleteSupplier } from "@/hooks/useSuppliers";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Pagination from "@/components/ui/Pagination";
import { inputCls, btnPrimary } from "@/lib/styles";
import { getApiError, formatDate } from "@/lib/utils";
import type { Supplier } from "@/types";

function SupplierForm({
  initial,
  onSubmit,
  loading,
  error,
  submitLabel = "Guardar",
}: {
  initial?: Partial<Supplier>;
  onSubmit: (d: { name: string; contact: string; phone: string; email: string; notes: string }) => void;
  loading: boolean;
  error?: string;
  submitLabel?: string;
}) {
  const [form, setForm] = useState({
    name:    initial?.name    ?? "",
    contact: initial?.contact ?? "",
    phone:   initial?.phone   ?? "",
    email:   initial?.email   ?? "",
    notes:   initial?.notes   ?? "",
  });
  const set = (f: keyof typeof form, v: string) => setForm((p) => ({ ...p, [f]: v }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">Nombre *</label>
        <input className={inputCls} placeholder="Nike Argentina" value={form.name} onChange={(e) => set("name", e.target.value)} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Contacto</label>
          <input className={inputCls} placeholder="Juan López" value={form.contact} onChange={(e) => set("contact", e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Teléfono</label>
          <input className={inputCls} placeholder="1123456789" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">Email</label>
        <input className={inputCls} type="email" placeholder="ventas@proveedor.com" value={form.email} onChange={(e) => set("email", e.target.value)} />
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">Notas</label>
        <input className={inputCls} placeholder="Observaciones..." value={form.notes} onChange={(e) => set("notes", e.target.value)} />
      </div>
      {error && <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>}
      <button type="submit" disabled={loading} className={`w-full ${btnPrimary}`}>
        {loading ? "Guardando..." : submitLabel}
      </button>
    </form>
  );
}

export default function SuppliersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formError, setFormError] = useState("");

  const { data: result, isLoading } = useSuppliers(search || undefined, page, 20);
  const suppliers = result?.data ?? [];

  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier(editSupplier?.id ?? "");
  const deleteSupplier = useDeleteSupplier();

  async function handleCreate(form: { name: string; contact: string; phone: string; email: string; notes: string }) {
    setFormError("");
    try {
      await createSupplier.mutateAsync({ ...form, email: form.email || undefined });
      setCreateOpen(false);
    } catch (e) {
      setFormError(getApiError(e));
    }
  }

  async function handleEdit(form: { name: string; contact: string; phone: string; email: string; notes: string }) {
    setFormError("");
    try {
      await updateSupplier.mutateAsync({ ...form, email: form.email || undefined });
      setEditSupplier(null);
    } catch (e) {
      setFormError(getApiError(e));
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Proveedores</h1>
          <p className="text-sm text-zinc-400 mt-0.5">{result?.total ?? 0} proveedores</p>
        </div>
        <button onClick={() => { setFormError(""); setCreateOpen(true); }} className={`px-4 py-2 ${btnPrimary}`}>
          + Nuevo proveedor
        </button>
      </div>

      {/* Búsqueda */}
      <input
        className="w-full max-w-sm rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20"
        placeholder="Buscar por nombre, contacto o email..."
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
      />

      {/* Lista */}
      {isLoading ? (
        <p className="text-zinc-400 text-sm">Cargando...</p>
      ) : suppliers.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">
          <p className="text-4xl mb-3">🏭</p>
          <p className="text-sm">No hay proveedores registrados</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 text-xs uppercase tracking-wide">
                <th className="text-left px-4 py-3">Nombre</th>
                <th className="text-left px-4 py-3">Contacto</th>
                <th className="text-left px-4 py-3">Teléfono</th>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-right px-4 py-3">Creado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {suppliers.map((s) => (
                <tr key={s.id} className="hover:bg-zinc-900/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-zinc-100">{s.name}</td>
                  <td className="px-4 py-3 text-zinc-400">{s.contact ?? "—"}</td>
                  <td className="px-4 py-3 text-zinc-400">{s.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-zinc-400">{s.email ?? "—"}</td>
                  <td className="px-4 py-3 text-right text-zinc-500 text-xs">{formatDate(s.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => { setFormError(""); setEditSupplier(s); }}
                        className="text-zinc-500 hover:text-zinc-100 transition-colors text-xs"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => setDeleteId(s.id)}
                        className="text-zinc-600 hover:text-red-400 transition-colors"
                        title="Eliminar"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {result && result.totalPages > 1 && (
        <Pagination page={result.page} totalPages={result.totalPages} total={result.total} limit={20} onPageChange={setPage} />
      )}

      {/* Modales */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nuevo proveedor">
        <SupplierForm onSubmit={handleCreate} loading={createSupplier.isPending} error={formError} submitLabel="Crear proveedor" />
      </Modal>

      <Modal open={!!editSupplier} onClose={() => setEditSupplier(null)} title="Editar proveedor">
        {editSupplier && (
          <SupplierForm initial={editSupplier} onSubmit={handleEdit} loading={updateSupplier.isPending} error={formError} submitLabel="Guardar cambios" />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        title="Eliminar proveedor"
        description="¿Seguro que querés eliminar este proveedor?"
        loading={deleteSupplier.isPending}
        onConfirm={async () => { await deleteSupplier.mutateAsync(deleteId!); setDeleteId(null); }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
