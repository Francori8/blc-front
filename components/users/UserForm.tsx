"use client";

import { useState } from "react";
import { inputCls, btnPrimary } from "@/lib/styles";

interface UserFormData {
  name: string;
  email: string;
  password: string;
}

interface UserFormProps {
  onSubmit: (data: UserFormData) => void;
  loading: boolean;
  error?: string;
}

export default function UserForm({ onSubmit, loading, error }: UserFormProps) {
  const [form, setForm] = useState<UserFormData>({ name: "", email: "", password: "" });

  const set = (f: keyof UserFormData, v: string) => setForm((p) => ({ ...p, [f]: v }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">Nombre</label>
        <input
          className={inputCls}
          placeholder="María López"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">Email</label>
        <input
          className={inputCls}
          type="email"
          placeholder="maria@ejemplo.com"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">Contraseña</label>
        <input
          className={inputCls}
          type="password"
          placeholder="Mínimo 6 caracteres"
          value={form.password}
          onChange={(e) => set("password", e.target.value)}
          minLength={6}
          required
        />
      </div>
      {error && (
        <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>
      )}
      <button type="submit" disabled={loading} className={`w-full ${btnPrimary}`}>
        {loading ? "Creando..." : "Crear usuario"}
      </button>
    </form>
  );
}
