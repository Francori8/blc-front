import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { getApiError } from "@/lib/utils";
import { toast } from "sonner";
import type { ProductCategory, ProductQuality, SaleSource } from "@/types";

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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["catalog", "categories"] });
      toast.success("Categoría creada");
    },
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      api.patch(`/catalog/categories/${id}`, { name }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["catalog", "categories"] });
      toast.success("Categoría actualizada");
    },
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/catalog/categories/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["catalog", "categories"] });
      toast.success("Categoría eliminada");
    },
    onError: (e) => toast.error(getApiError(e)),
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["catalog", "qualities"] });
      toast.success("Calidad creada");
    },
  });
}

export function useUpdateQuality() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      api.patch(`/catalog/qualities/${id}`, { name }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["catalog", "qualities"] });
      toast.success("Calidad actualizada");
    },
  });
}

export function useDeleteQuality() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/catalog/qualities/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["catalog", "qualities"] });
      toast.success("Calidad eliminada");
    },
    onError: (e) => toast.error(getApiError(e)),
  });
}

// ─── Canales de venta ─────────────────────────────────────────────────────────

export function useSaleSources() {
  return useQuery({
    queryKey: ["catalog", "sale-sources"],
    queryFn: async () => {
      const { data } = await api.get<SaleSource[]>("/catalog/sale-sources");
      return data;
    },
  });
}

export function useCreateSaleSource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.post("/catalog/sale-sources", { name }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["catalog", "sale-sources"] });
      toast.success("Canal de venta creado");
    },
  });
}

export function useUpdateSaleSource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      api.patch(`/catalog/sale-sources/${id}`, { name }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["catalog", "sale-sources"] });
      toast.success("Canal de venta actualizado");
    },
  });
}

export function useDeleteSaleSource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/catalog/sale-sources/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["catalog", "sale-sources"] });
      toast.success("Canal de venta eliminado");
    },
    onError: (e) => toast.error(getApiError(e)),
  });
}
