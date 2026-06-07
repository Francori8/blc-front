import type { ProductStatus, PaymentMethod, PurchaseOrderStatus } from "@/types";

const STATUS_STYLES: Record<ProductStatus, string> = {
  IN_STOCK:    "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  ON_REQUEST:  "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  UNAVAILABLE: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
};

const STATUS_LABEL: Record<ProductStatus, string> = {
  IN_STOCK:    "En stock",
  ON_REQUEST:  "A pedido",
  UNAVAILABLE: "No disponible",
};

const PAYMENT_STYLES: Record<PaymentMethod, string> = {
  CASH:        "bg-blue-500/15 text-blue-400 border-blue-500/20",
  TRANSFER:    "bg-purple-500/15 text-purple-400 border-purple-500/20",
  MERCADOPAGO: "bg-sky-500/15 text-sky-400 border-sky-500/20",
};

const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  CASH:        "Efectivo",
  TRANSFER:    "Transferencia",
  MERCADOPAGO: "MercadoPago",
};

export function StatusBadge({ status }: { status: ProductStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

const ORDER_STATUS_STYLES: Record<PurchaseOrderStatus, string> = {
  PENDING:   "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  RECEIVED:  "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  CANCELLED: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
};

const ORDER_STATUS_LABEL: Record<PurchaseOrderStatus, string> = {
  PENDING:   "Pendiente",
  RECEIVED:  "Recibida",
  CANCELLED: "Cancelada",
};

export function OrderStatusBadge({ status }: { status: PurchaseOrderStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${ORDER_STATUS_STYLES[status]}`}>
      {ORDER_STATUS_LABEL[status]}
    </span>
  );
}

export function PaymentBadge({ method }: { method: PaymentMethod }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${PAYMENT_STYLES[method]}`}>
      {PAYMENT_LABEL[method]}
    </span>
  );
}
