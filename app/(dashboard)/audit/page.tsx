"use client";

import { useState } from "react";
import { useAuditLogs } from "@/hooks/useAudit";
import Pagination from "@/components/ui/Pagination";
import { formatDate } from "@/lib/utils";
import type { AuditLog, AuditModule } from "@/types";

const MODULE_LABELS: Record<string, string> = {
  SALES:           "Ventas",
  PRODUCTS:        "Productos",
  ORDERS:          "Pedidos",
  PURCHASE_ORDERS: "Órdenes de compra",
  USERS:           "Usuarios",
  CLIENTS:         "Clientes",
  SUPPLIERS:       "Proveedores",
};

const ACTION_LABELS: Record<string, string> = {
  CREATE:     "Creó",
  UPDATE:     "Editó",
  DELETE:     "Eliminó",
  DELIVER:    "Entregó",
  CANCEL:     "Canceló",
  RECEIVE:    "Recibió",
  RESERVE:    "Reservó",
  DEACTIVATE: "Desactivó",
};

const MODULE_COLORS: Record<string, string> = {
  SALES:           "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
  PRODUCTS:        "bg-blue-400/10 text-blue-400 border-blue-400/20",
  ORDERS:          "bg-amber-400/10 text-amber-400 border-amber-400/20",
  PURCHASE_ORDERS: "bg-purple-400/10 text-purple-400 border-purple-400/20",
  USERS:           "bg-zinc-600/50 text-zinc-400 border-zinc-600",
  CLIENTS:         "bg-pink-400/10 text-pink-400 border-pink-400/20",
  SUPPLIERS:       "bg-orange-400/10 text-orange-400 border-orange-400/20",
};

const MODULES: AuditModule[] = ["SALES", "PRODUCTS", "ORDERS", "PURCHASE_ORDERS", "USERS", "CLIENTS", "SUPPLIERS"];

function formatDateTime(date: string) {
  return new Date(date).toLocaleString("es-AR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function AuditPage() {
  const [moduleFilter, setModuleFilter] = useState<AuditModule | "">("");
  const [page, setPage] = useState(1);

  const { data: result, isLoading } = useAuditLogs(
    moduleFilter || undefined,
    undefined,
    page,
    50,
  );

  const logs: AuditLog[] = result?.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Historial</h1>
        <p className="text-sm text-zinc-400 mt-0.5">{result?.total ?? 0} movimientos</p>
      </div>

      {/* Filtro por módulo */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => { setModuleFilter(""); setPage(1); }}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors border ${
            moduleFilter === ""
              ? "bg-white text-zinc-950 border-white"
              : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
          }`}
        >
          Todos
        </button>
        {MODULES.map((m) => (
          <button
            key={m}
            onClick={() => { setModuleFilter(m); setPage(1); }}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors border ${
              moduleFilter === m
                ? "bg-white text-zinc-950 border-white"
                : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
            }`}
          >
            {MODULE_LABELS[m]}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-zinc-400 text-sm">Cargando...</p>
      ) : logs.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-sm">No hay movimientos</p>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-800 overflow-hidden">
          {logs.map((log: AuditLog, i: number) => (
            <div
              key={log.id}
              className={`flex items-start gap-4 px-5 py-3.5 ${
                i !== logs.length - 1 ? "border-b border-zinc-800" : ""
              } hover:bg-zinc-900/50 transition-colors`}
            >
              {/* Badge módulo */}
              <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full border mt-0.5 ${MODULE_COLORS[log.module] ?? ""}`}>
                {MODULE_LABELS[log.module] ?? log.module}
              </span>

              {/* Descripción */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-100">{log.description}</p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {ACTION_LABELS[log.action] ?? log.action}
                  {log.user ? ` · ${log.user.name}` : ""}
                  {" · "}
                  {formatDateTime(log.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {result && result.totalPages > 1 && (
        <Pagination
          page={result.page}
          totalPages={result.totalPages}
          total={result.total}
          limit={50}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
