"use client";

import { useState } from "react";
import { inputCls, btnPrimary } from "@/lib/styles";
import type { Client } from "@/types";

interface ClientFormData {
  name: string;
  instagram: string;
  phone: string;
  notes: string;
}

interface ClientFormProps {
  initial?: Partial<Client>;
  onSubmit: (data: ClientFormData) => void;
  loading: boolean;
  error?: string;
  submitLabel?: string;
}

export default function ClientForm({ initial, onSubmit, loading, error, submitLabel = "Guardar cliente" }: ClientFormProps) {
  const [form, setForm] = useState<ClientFormData>({
    name: initial?.name ?? "",
    instagram: initial?.instagram ?? "",
    phone: initial?.phone ?? "",
    notes: initial?.notes ?? "",
  });

  const set = (f: keyof ClientFormData, v: string) => setForm((p) => ({ ...p, [f]: v }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">Nombre</label>
        <input className={inputCls} placeholder="Juan García" value={form.name} onChange={(e) => set("name", e.target.value)} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Instagram</label>
          <input className={inputCls} placeholder="juangarcia" value={form.instagram} onChange={(e) => set("instagram", e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Teléfono</label>
          <input className={inputCls} placeholder="1123456789" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">Notas</label>
        <input className={inputCls} placeholder="Observaciones..." value={form.notes} onChange={(e) => set("notes", e.target.value)} />
      </div>
      {error && (
        <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>
      )}
      <button type="submit" disabled={loading} className={`w-full ${btnPrimary}`}>
        {loading ? "Guardando..." : submitLabel}
      </button>
    </form>
  );
}
