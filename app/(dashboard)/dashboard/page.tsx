"use client";

import { useState } from "react";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { useStats } from "@/hooks/useStats";
import { formatCurrency } from "@/lib/utils";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function firstOfMonthISO() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

const PAYMENT_LABELS: Record<string, string> = {
  CASH: "Efectivo",
  TRANSFER: "Transferencia",
  MERCADOPAGO: "MercadoPago",
};

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-4">
      <p className="text-xs text-zinc-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color ?? "text-zinc-100"}`}>{value}</p>
      {sub && <p className="text-xs text-zinc-500 mt-0.5">{sub}</p>}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs space-y-1">
      <p className="text-zinc-400 font-medium">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const [from, setFrom] = useState(firstOfMonthISO());
  const [to, setTo]     = useState(todayISO());

  const { data, isLoading } = useStats(from, to);

  const summary = data?.summary;
  const byDay   = data?.byDay ?? [];
  const topProducts = data?.topProducts ?? [];
  const byPayment   = data?.byPayment ?? [];

  // Formatear fechas del eje X: "01/06"
  const chartData = byDay.map((d) => ({
    ...d,
    label: d.date.slice(5).replace("-", "/"),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-zinc-400 mt-0.5">Resumen del período seleccionado</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={from}
            max={to}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-white/20"
          />
          <span className="text-zinc-600 text-sm">–</span>
          <input
            type="date"
            value={to}
            min={from}
            max={todayISO()}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-white/20"
          />
        </div>
      </div>

      {isLoading ? (
        <p className="text-zinc-400 text-sm">Cargando...</p>
      ) : (
        <>
          {/* Tarjetas resumen */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              label="Ventas"
              value={String(summary?.totalSales ?? 0)}
              sub="unidades vendidas"
            />
            <StatCard
              label="Facturación"
              value={formatCurrency(summary?.totalRevenue ?? 0)}
              sub="precio de venta total"
            />
            <StatCard
              label="Ganancia"
              value={formatCurrency(summary?.totalProfit ?? 0)}
              color={Number(summary?.totalProfit ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}
              sub={`Margen ${summary?.margin ?? 0}%`}
            />
            <StatCard
              label="Costo"
              value={formatCurrency(summary?.totalCost ?? 0)}
              sub="costo total del período"
            />
          </div>

          {/* Gráfico de ventas por día */}
          {chartData.length > 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              <p className="text-sm font-medium text-zinc-300 mb-4">Facturación y ganancia por día</p>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a1a1aa" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#a1a1aa" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="profit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34d399" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="label" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} width={55} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="revenue" name="Facturación" stroke="#a1a1aa" fill="url(#revenue)" strokeWidth={1.5} dot={false} />
                  <Area type="monotone" dataKey="profit"  name="Ganancia"    stroke="#34d399" fill="url(#profit)"  strokeWidth={1.5} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-10 text-center text-zinc-500 text-sm">
              Sin ventas en el período seleccionado
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top productos */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              <p className="text-sm font-medium text-zinc-300 mb-4">Top productos</p>
              {topProducts.length === 0 ? (
                <p className="text-zinc-500 text-sm">Sin datos</p>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={topProducts} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                    <XAxis type="number" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}`} />
                    <YAxis type="category" dataKey="label" tick={{ fill: "#a1a1aa", fontSize: 11 }} axisLine={false} tickLine={false} width={130}
                      tickFormatter={(v: string) => v.length > 18 ? v.slice(0, 18) + "…" : v}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload;
                        return (
                          <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs space-y-1">
                            <p className="text-zinc-300 font-medium">{d.label}</p>
                            <p className="text-zinc-400">{d.count} vendidos</p>
                            <p className="text-emerald-400">Ganancia: {formatCurrency(d.profit)}</p>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="count" name="Unidades" fill="#a1a1aa" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Métodos de pago */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              <p className="text-sm font-medium text-zinc-300 mb-4">Métodos de pago</p>
              {byPayment.length === 0 ? (
                <p className="text-zinc-500 text-sm">Sin datos</p>
              ) : (
                <div className="space-y-3">
                  {byPayment.map((p) => {
                    const pct = summary?.totalSales
                      ? Math.round((p.count / summary.totalSales) * 100)
                      : 0;
                    return (
                      <div key={p.method}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-zinc-300">{PAYMENT_LABELS[p.method] ?? p.method}</span>
                          <span className="text-xs text-zinc-500">{p.count} ventas · {formatCurrency(p.revenue)}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-zinc-800">
                          <div
                            className="h-1.5 rounded-full bg-zinc-400 transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
