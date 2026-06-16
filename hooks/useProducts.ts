import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { getApiError } from "@/lib/utils";
import { toast } from "sonner";
import type { Product, ProductStatus, Paginated } from "@/types";

export function useProducts(filters?: { status?: ProductStatus; brand?: string; size?: string; lowStock?: boolean; categoryId?: string; qualityId?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ["products", filters],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Product>>("/products", { params: filters });
      return data;
    },
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ["products", id],
    queryFn: async () => {
      const { data } = await api.get<Product>(`/products/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: unknown) => api.post("/products", payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Producto creado");
    },
  });
}

export function useUpdateProduct(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: unknown) => api.patch(`/products/${id}`, payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Producto actualizado");
    },
  });
}

export function useUpdateSize() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sizeId, ...payload }: { sizeId: string; stock: number; purchasePrice?: number | null; salePrice?: number | null }) =>
      api.patch(`/products/sizes/${sizeId}`, payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Talle actualizado");
    },
  });
}

export function useUpdateProductImages(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (images: string[]) => api.patch(`/products/${id}`, { images }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Producto eliminado");
    },
    onError: (e) => toast.error(getApiError(e)),
  });
}
