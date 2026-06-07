"use client";

import { useState } from "react";
import {
  useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory,
  useQualities, useCreateQuality, useUpdateQuality, useDeleteQuality,
} from "@/hooks/useCatalog";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { getApiError } from "@/lib/utils";
import { inputCls } from "@/lib/styles";

interface CatalogItem { id: string; name: string }

interface CatalogSectionProps {
  title: string;
  description: string;
  items: CatalogItem[];
  onCreate: (name: string) => Promise<unknown>;
  onUpdate: (id: string, name: string) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
  isCreating: boolean;
  isDeleting: boolean;
}

function CatalogSection({ title, description, items, onCreate, onUpdate, onDelete, isCreating, isDeleting }: CatalogSectionProps) {
  const [newName, setNewName] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [deleteItem, setDeleteItem] = useState<CatalogItem | null>(null);
  const [error, setError] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setError("");
    try {
      await onCreate(newName.trim());
      setNewName("");
    } catch (err) {
      setError(getApiError(err));
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editId || !editName.trim()) return;
    setError("");
    try {
      await onUpdate(editId, editName.trim());
      setEditId(null);
      setEditName("");
    } catch (err) {
      setError(getApiError(err));
    }
  }

  async function handleDelete() {
    if (!deleteItem) return;
    try {
      await onDelete(deleteItem.id);
      setDeleteItem(null);
    } catch (err) {
      setError(getApiError(err));
      setDeleteItem(null);
    }
  }

  const singular = title.toLowerCase().replace(/s$/, "");

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
      </div>

      <div className="space-y-2 min-h-[40px]">
        {items.length === 0 && (
          <p className="text-xs text-zinc-600">Sin {title.toLowerCase()} todavía</p>
        )}
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-2">
            {editId === item.id ? (
              <form onSubmit={handleUpdate} className="flex gap-2 flex-1">
                <input
                  className={`${inputCls} flex-1`}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  autoFocus
                />
                <button type="submit" className="text-xs text-zinc-100 bg-zinc-700 hover:bg-zinc-600 px-3 py-1.5 rounded-lg transition-colors">
                  Guardar
                </button>
                <button type="button" onClick={() => { setEditId(null); setError(""); }} className="text-xs text-zinc-500 hover:text-zinc-300 px-2">
                  Cancelar
                </button>
              </form>
            ) : (
              <>
                <span className="flex-1 text-sm text-zinc-200">{item.name}</span>
                <button
                  onClick={() => { setEditId(item.id); setEditName(item.name); setError(""); }}
                  className="text-xs text-zinc-500 hover:text-zinc-100 px-2 py-1 rounded hover:bg-zinc-800 transition-colors"
                >
                  Editar
                </button>
                <button
                  onClick={() => setDeleteItem(item)}
                  className="text-xs text-zinc-600 hover:text-red-400 px-2 py-1 rounded hover:bg-zinc-800 transition-colors"
                >
                  Eliminar
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleCreate} className="flex gap-2 pt-2 border-t border-zinc-800">
        <input
          className={`${inputCls} flex-1`}
          placeholder={`Nueva ${singular}...`}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button
          type="submit"
          disabled={isCreating || !newName.trim()}
          className="text-xs font-medium text-zinc-950 bg-white hover:bg-zinc-200 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 shrink-0"
        >
          {isCreating ? "..." : "+ Agregar"}
        </button>
      </form>

      {error && (
        <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>
      )}

      <ConfirmDialog
        open={!!deleteItem}
        title={`Eliminar ${singular}`}
        description={deleteItem ? `¿Eliminar "${deleteItem.name}"? Los productos que la usen quedarán sin ${singular}.` : ""}
        confirmLabel="Eliminar"
        loading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </div>
  );
}

export default function CatalogPage() {
  const { data: categories = [] } = useCategories();
  const { data: qualities = [] } = useQualities();

  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const createQuality = useCreateQuality();
  const updateQuality = useUpdateQuality();
  const deleteQuality = useDeleteQuality();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configuración de productos</h1>
        <p className="text-sm text-zinc-400 mt-0.5">Administrá las categorías y calidades disponibles</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <CatalogSection
          title="Categorías"
          description="Tipo de producto: zapatillas, camperas, accesorios, etc."
          items={categories}
          onCreate={(name) => createCategory.mutateAsync(name)}
          onUpdate={(id, name) => updateCategory.mutateAsync({ id, name })}
          onDelete={(id) => deleteCategory.mutateAsync(id)}
          isCreating={createCategory.isPending}
          isDeleting={deleteCategory.isPending}
        />

        <CatalogSection
          title="Calidades"
          description="Nivel de calidad: Muy buena, Buena, Light, etc."
          items={qualities}
          onCreate={(name) => createQuality.mutateAsync(name)}
          onUpdate={(id, name) => updateQuality.mutateAsync({ id, name })}
          onDelete={(id) => deleteQuality.mutateAsync(id)}
          isCreating={createQuality.isPending}
          isDeleting={deleteQuality.isPending}
        />
      </div>
    </div>
  );
}
