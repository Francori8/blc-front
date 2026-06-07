import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { CustomerOrder, Paginated, PendingItem } from "@/types";

export function useCustomerOrders(clientId?: string, status?: string, page?: number, limit?: number) {
  return useQuery({
    queryKey: ["customer-orders", clientId, status, page, limit],
    queryFn: async () => {
      const { data } = await api.get<Paginated<CustomerOrder>>("/customer-orders", {
        params: {
          ...(clientId ? { clientId } : {}),
          ...(status ? { status } : {}),
          page,
          limit,
        },
      });
      return data;
    },
  });
}

export function useCustomerOrder(id: string) {
  return useQuery({
    queryKey: ["customer-orders", id],
    queryFn: async () => {
      const { data } = await api.get<CustomerOrder>(`/customer-orders/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function usePendingItems() {
  return useQuery({
    queryKey: ["customer-orders", "pending-items"],
    queryFn: async () => {
      const { data } = await api.get<PendingItem[]>("/customer-orders/pending-items");
      return data;
    },
  });
}

export function useCreateCustomerOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: unknown) =>
      api.post("/customer-orders", payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customer-orders"] }),
  });
}

export function useDeliverItem(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) =>
      api.post(`/customer-orders/${orderId}/items/${itemId}/deliver`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customer-orders"] }),
  });
}

export function useReserveItem(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) =>
      api.post(`/customer-orders/${orderId}/items/${itemId}/reserve`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customer-orders"] }),
  });
}

export function useCancelCustomerOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post(`/customer-orders/${id}/cancel`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customer-orders"] }),
  });
}
