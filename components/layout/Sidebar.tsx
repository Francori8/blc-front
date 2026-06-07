"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/auth";
import { useState } from "react";

const NAV = [
  { href: "/dashboard",       label: "Dashboard",        icon: "📊" },
  { href: "/products",        label: "Productos",        icon: "📦" },
  { href: "/clients",         label: "Clientes",         icon: "👤" },
  { href: "/sales",           label: "Ventas",           icon: "💸" },
  { href: "/suppliers",       label: "Proveedores",      icon: "🏭" },
  { href: "/purchase-orders",  label: "Órdenes de compra", icon: "🛒" },
  { href: "/customer-orders", label: "Pedidos",           icon: "📦" },
  { href: "/users",           label: "Usuarios",          icon: "👥" },
  { href: "/audit",           label: "Historial",         icon: "📋" },
  { href: "/catalog",         label: "Catálogo",          icon: "⚙️" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between bg-zinc-900 border-b border-zinc-800 px-4 py-3">
        <span className="text-lg font-bold tracking-tight">BLC Shops</span>
        <button
          onClick={() => setOpen(!open)}
          className="text-zinc-400 hover:text-zinc-100 transition-colors p-1"
          aria-label="Toggle menu"
        >
          {open ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-black/50"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-40
          flex flex-col w-56 shrink-0 bg-zinc-900 border-r border-zinc-800 px-3 py-4
          transition-transform duration-200
          md:translate-x-0
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Brand — hidden on mobile (shown in top bar) */}
        <div className="px-2 mb-6 hidden md:block">
          <span className="text-lg font-bold tracking-tight">BLC Shops</span>
        </div>

        {/* Spacer for mobile top bar */}
        <div className="md:hidden h-2" />

        {/* Nav */}
        <nav className="flex-1 space-y-1 mt-2 md:mt-0">
          {NAV.map(({ href, label, icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-white text-zinc-950"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                }`}
              >
                <span>{icon}</span>
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <button
          onClick={logout}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors w-full text-left"
        >
          <span>🚪</span>
          Cerrar sesión
        </button>
      </aside>
    </>
  );
}
