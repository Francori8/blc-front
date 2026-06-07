# BLC Shops — Web

Frontend del sistema de gestión de BLC Shops. Next.js + React Query + Tailwind CSS.

- **Puerto:** `3000`
- **URL:** `http://localhost:3000`

---

## Requisitos

- Node.js 18+
- El API (`blc-api`) corriendo en `localhost:3001`

---

## Primer uso (clonar el repo por primera vez)

```bash
# 1. Instalar dependencias
pnpm install

# 2. Levantar en modo desarrollo
pnpm run dev
```

---

## Levantar en desarrollo (uso diario)

```bash
pnpm run dev
```

---

## Variables de entorno

El archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

---

## Orden para levantar el proyecto completo

Siempre levantar primero el API, luego el frontend:

```bash
# Terminal 1 — API
cd blc-api
pnpm run start:dev

# Terminal 2 — Web
cd blc-web
pnpm run dev
```

Luego entrar a `http://localhost:3000` con:
- Email: `admin@blcshops.com`
- Contraseña: `admin123`

---

## Otros comandos

```bash
# Build para producción
pnpm run build

# Correr build de producción
pnpm run start

# Linter
pnpm run lint
```
