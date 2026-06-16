import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { getApiError } from "@/lib/utils";
import { toast } from "sonner";
import type { PurchaseOrder, Paginated } from "@/types";

export function usePurchaseOrders(supplierId?: string, page?: number, limit?: number) {
  return useQuery({
    queryKey: ["purchase-orders", supplierId, page, limit],
    queryFn: async () => {
      const { data } = await api.get<Paginated<PurchaseOrder>>("/purchase-orders", {
        params: { ...(supplierId ? { supplierId } : {}), page, limit },
      });
      return data;
    },
  });
}

export function usePurchaseOrder(id: string) {
  return useQuery({
    queryKey: ["purchase-orders", id],
    queryFn: async () => {
      const { data } = await api.get<PurchaseOrder>(`/purchase-orders/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreatePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: unknown) =>
      api.post("/purchase-orders", payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast.success("Orden de compra creada");
    },
  });
}

export function useReceivePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post(`/purchase-orders/${id}/receive`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase-orders"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Orden recibida — stock actualizado");
    },
    onError: (e) => toast.error(getApiError(e)),
  });
}

export function useUpdatePurchaseOrder(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { notes?: string; orderedAt?: string; receivedAt?: string }) =>
      api.patch(`/purchase-orders/${id}`, payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast.success("Orden actualizada");
    },
    onError: (e) => toast.error(getApiError(e)),
  });
}

export function useCancelPurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post(`/purchase-orders/${id}/cancel`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast.success("Orden cancelada");
    },
    onError: (e) => toast.error(getApiError(e)),
  });
}
