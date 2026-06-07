export function getApiError(e: unknown): string {
  const err = e as { response?: { data?: { message?: string | string[] } } };
  const msg = err?.response?.data?.message;
  if (Array.isArray(msg)) return msg[0];
  return msg ?? "Ocurrió un error inesperado";
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("es-AR");
}

export function formatCurrency(value: string | number): string {
  return `$${parseFloat(String(value)).toLocaleString("es-AR")}`;
}
