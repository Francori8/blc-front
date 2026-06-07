import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ProductCategory, ProductQuality } from "@/types";

// ─── Categorías ───────────────────────────────────────────────────────────────

export function useCategories() {
  return useQuery({
    queryKey: ["catalog", "categories"],
    queryFn: async () => {
      const { data } = await api.get<ProductCategory[]>("/catalog/categories");
      return data;
    },
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.post("/catalog/categories", { name }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["catalog", "categories"] }),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      api.patch(`/catalog/categories/${id}`, { name }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["catalog", "categories"] }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/catalog/categories/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["catalog", "categories"] }),
  });
}

// ─── Calidades ────────────────────────────────────────────────────────────────

export function useQualities() {
  return useQuery({
    queryKey: ["catalog", "qualities"],
    queryFn: async () => {
      const { data } = await api.get<ProductQuality[]>("/catalog/qualities");
      return data;
    },
  });
}

export function useCreateQuality() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.post("/catalog/qualities", { name }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["catalog", "qualities"] }),
  });
}

export function useUpdateQuality() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      api.patch(`/catalog/qualities/${id}`, { name }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["catalog", "qualities"] }),
  });
}

export function useDeleteQuality() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/catalog/qualities/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["catalog", "qualities"] }),
  });
}
