"use client";

import { useState } from "react";
import { useUsers, useCreateUser, useDeactivateUser } from "@/hooks/useUsers";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import UserForm from "@/components/users/UserForm";
import { getApiError, formatDate } from "@/lib/utils";
import type { User } from "@/types";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Admin",
  STAFF: "Staff",
};

export default function UsersPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [createError, setCreateError] = useState("");
  const [deactivateUser, setDeactivateUser] = useState<User | null>(null);

  const { data: users = [], isLoading } = useUsers();
  const createUser = useCreateUser();
  const deactivateMutation = useDeactivateUser();

  async function handleCreate(form: { name: string; email: string; password: string }) {
    setCreateError("");
    try {
      await createUser.mutateAsync(form);
      setCreateOpen(false);
    } catch (e) {
      setCreateError(getApiError(e));
    }
  }

  async function handleDeactivate() {
    if (!deactivateUser) return;
    try {
      await deactivateMutation.mutateAsync(deactivateUser.id);
    } finally {
      setDeactivateUser(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Usuarios</h1>
          <p className="text-sm text-zinc-400 mt-0.5">{users.length} usuarios</p>
        </div>
        <button
          onClick={() => { setCreateOpen(true); setCreateError(""); }}
          className="rounded-lg bg-white text-zinc-950 px-4 py-2 text-sm font-semibold hover:bg-zinc-200 transition-colors"
        >
          + Nuevo usuario
        </button>
      </div>

      {isLoading ? (
        <p className="text-zinc-400 text-sm">Cargando...</p>
      ) : users.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">
          <p className="text-4xl mb-3">👥</p>
          <p className="text-sm">No hay usuarios</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {users.map((user: User) => (
            <div key={user.id} className="rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 transition-colors">
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="shrink-0 w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-medium text-zinc-300">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-zinc-100 truncate">{user.name}</p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        user.role === "ADMIN"
                          ? "bg-amber-400/10 text-amber-400 border border-amber-400/20"
                          : "bg-zinc-700/50 text-zinc-400 border border-zinc-700"
                      }`}>
                        {ROLE_LABEL[user.role] ?? user.role}
                      </span>
                      {!user.active && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-400/10 text-red-400 border border-red-400/20">
                          Inactivo
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5 truncate">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-4 shrink-0">
                  <span className="text-xs text-zinc-600 hidden sm:block">{formatDate(user.createdAt)}</span>
                  {user.active && user.role !== "ADMIN" && (
                    <button
                      onClick={() => setDeactivateUser(user)}
                      className="text-xs text-zinc-600 hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-zinc-800"
                    >
                      Desactivar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nuevo usuario">
        <UserForm
          key={createOpen ? "open" : "closed"}
          onSubmit={handleCreate}
          loading={createUser.isPending}
          error={createError}
        />
      </Modal>

      <ConfirmDialog
        open={!!deactivateUser}
        title="Desactivar usuario"
        description={deactivateUser ? `¿Desactivar a "${deactivateUser.name}"? Ya no podrá iniciar sesión.` : ""}
        confirmLabel="Desactivar"
        loading={deactivateMutation.isPending}
        onConfirm={handleDeactivate}
        onCancel={() => setDeactivateUser(null)}
      />
    </div>
  );
}
