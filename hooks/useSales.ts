import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Sale, ProfitReport, PaymentMethod, Paginated } from "@/types";

export function useSales(filters?: { clientId?: string; paymentMethod?: PaymentMethod; from?: string; to?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ["sales", filters],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Sale>>("/sales", { params: filters });
      return data;
    },
  });
}

export function useCreateSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: unknown) => api.post("/sales", payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useDeleteSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, restoreStock }: { id: string; restoreStock: boolean }) =>
      api.delete(`/sales/${id}`, { params: { restoreStock } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["profit"] });
    },
  });
}

export function useProfitReport(from?: string, to?: string) {
  return useQuery({
    queryKey: ["profit", from, to],
    queryFn: async () => {
      const { data } = await api.get<ProfitReport>("/sales/reports/profit", {
        params: { from, to },
      });
      return data;
    },
  });
}
