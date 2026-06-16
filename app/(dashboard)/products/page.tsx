"use client";

import { useState, Fragment } from "react";
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from "@/hooks/useProducts";
import { useCategories, useQualities } from "@/hooks/useCatalog";
import { StatusBadge } from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Pagination from "@/components/ui/Pagination";
import ProductForm from "@/components/products/ProductForm";
import { getApiError, formatCurrency } from "@/lib/utils";
import ImageCarousel from "@/components/ui/ImageCarousel";
import type { Product, ProductStatus } from "@/types";

const STATUS_FILTERS: { value: ProductStatus | "ALL"; label: string }[] = [
  { value: "ALL",         label: "Todos" },
  { value: "IN_STOCK",    label: "En stock" },
  { value: "ON_REQUEST",  label: "A pedido" },
  { value: "UNAVAILABLE", label: "No disponible" },
];

function EditProductWrapper({ product, onClose }: { product: Product; onClose: () => void }) {
  const [error, setError] = useState("");
  const update = useUpdateProduct(product.id);

  async function handleSubmit(form: {
    brand: string; model: string; colorway: string; description: string;
    status: ProductStatus; purchasePrice: string; salePrice: string;
    categoryId: string; qualityId: string;
    sizes: { size: string; stock: number; purchasePrice: string; salePrice: string }[];
    images: string[];
  }) {
    setError("");
    try {
      await update.mutateAsync({
        brand: form.brand,
        model: form.model,
        colorway: form.colorway,
        description: form.description,
        status: form.status,
        purchasePrice: parseFloat(form.purchasePrice),
        salePrice: parseFloat(form.salePrice),
        images: form.images,
        categoryId: form.categoryId || null,
        qualityId: form.qualityId || null,
        sizes: form.sizes.map((s) => ({
          size: s.size,
          stock: s.stock,
          purchasePrice: s.purchasePrice.trim() !== "" ? parseFloat(s.purchasePrice) : undefined,
          salePrice:     s.salePrice.trim()     !== "" ? parseFloat(s.salePrice)     : undefined,
        })),
      });
      onClose();
    } catch (e) {
      setError(getApiError(e));
    }
  }

  return (
    <ProductForm
      initial={product}
      onSubmit={handleSubmit}
      loading={update.isPending}
      error={error}
      submitLabel="Guardar cambios"
    />
  );
}

export default function ProductsPage() {
  const [statusFilter, setStatusFilter] = useState<ProductStatus | "ALL">("ALL");
  const [lowStock, setLowStock] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [qualityFilter, setQualityFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [createError, setCreateError] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [carousel, setCarousel] = useState<{ images: string[]; index: number } | null>(null);

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const { data: categories = [] } = useCategories();
  const { data: qualities = [] } = useQualities();

  const { data: result, isLoading } = useProducts({
    ...(statusFilter !== "ALL" ? { status: statusFilter } : {}),
    ...(lowStock ? { lowStock: true } : {}),
    ...(categoryFilter ? { categoryId: categoryFilter } : {}),
    ...(qualityFilter ? { qualityId: qualityFilter } : {}),
    page,
    limit: 20,
  });

  const allProducts = result?.data ?? [];
  const products = search
    ? allProducts.filter((p) =>
        `${p.brand} ${p.model} ${p.colorway}`.toLowerCase().includes(search.toLowerCase())
      )
    : allProducts;

  const createProduct = useCreateProduct();
  const deleteProductMutation = useDeleteProduct();

  async function handleCreate(form: {
    brand: string; model: string; colorway: string; description: string;
    status: ProductStatus; purchasePrice: string; salePrice: string;
    categoryId: string; qualityId: string;
    sizes: { size: string; stock: number; purchasePrice: string; salePrice: string }[];
    images: string[];
  }) {
    setCreateError("");
    try {
      await createProduct.mutateAsync({
        ...form,
        purchasePrice: parseFloat(form.purchasePrice),
        salePrice: parseFloat(form.salePrice),
        categoryId: form.categoryId || undefined,
        qualityId: form.qualityId || undefined,
        images: form.images,
        sizes: form.sizes.map((s) => ({
          size: s.size,
          stock: s.stock,
          purchasePrice: s.purchasePrice.trim() !== "" ? parseFloat(s.purchasePrice) : undefined,
          salePrice: s.salePrice.trim() !== "" ? parseFloat(s.salePrice) : undefined,
        })),
      });
      setCreateOpen(false);
    } catch (e) {
      setCreateError(getApiError(e));
    }
  }

  async function handleDelete() {
    if (!deleteProduct) return;
    try {
      await deleteProductMutation.mutateAsync(deleteProduct.id);
      setDeleteProduct(null);
    } catch (e) {
      setDeleteProduct(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Productos</h1>
          <p className="text-sm text-zinc-400 mt-0.5">{result?.total ?? 0} productos en total</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              const { data } = await import("@/lib/api").then(m => m.api.get("/products/export/csv", { responseType: "blob" }));
              const url = URL.createObjectURL(data);
              const a = document.createElement("a");
              a.href = url;
              a.download = "productos.csv";
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="rounded-lg border border-zinc-700 text-zinc-400 px-4 py-2 text-sm font-medium hover:text-zinc-100 hover:border-zinc-500 transition-colors"
          >
            ↓ CSV
          </button>
          <button
            onClick={() => setCreateOpen(true)}
            className="rounded-lg bg-white text-zinc-950 px-4 py-2 text-sm font-semibold hover:bg-zinc-200 transition-colors"
          >
            + Nuevo producto
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Buscar por marca, modelo o colorway..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20"
          />
          {categories.length > 0 && (
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              className="rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-white/20"
            >
              <option value="">Todas las categorías</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
          {qualities.length > 0 && (
            <select
              value={qualityFilter}
              onChange={(e) => { setQualityFilter(e.target.value); setPage(1); }}
              className="rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-white/20"
            >
              <option value="">Todas las calidades</option>
              {qualities.map((q) => <option key={q.id} value={q.id}>{q.name}</option>)}
            </select>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => { setStatusFilter(value); setLowStock(false); setPage(1); }}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                statusFilter === value && !lowStock
                  ? "bg-white text-zinc-950"
                  : "bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-zinc-100"
              }`}
            >
              {label}
            </button>
          ))}
          <button
            onClick={() => { setLowStock((v) => !v); setStatusFilter("ALL"); setPage(1); }}
            className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
              lowStock
                ? "bg-yellow-400 text-zinc-950"
                : "bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-zinc-100"
            }`}
          >
            ⚠️ Stock bajo
          </button>
        </div>
      </div>

      {/* Tabla */}
      {isLoading ? (
        <p className="text-zinc-400 text-sm">Cargando...</p>
      ) : products.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">
          <p className="text-4xl mb-3">📦</p>
          <p className="text-sm">No hay productos</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 text-xs uppercase tracking-wide">
                <th className="text-left px-4 py-3">Producto</th>
                <th className="text-left px-4 py-3">Estado</th>
                <th className="text-left px-4 py-3">Talles</th>
                <th className="text-right px-4 py-3">Compra</th>
                <th className="text-right px-4 py-3">Venta</th>
                <th className="text-right px-4 py-3">Ganancia</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {products.map((product) => {
                const totalStock = product.sizes.reduce((s, sz) => s + sz.stock, 0);
                const isLowStock = product.status !== "UNAVAILABLE" && product.sizes.some((sz) => sz.stock <= 1);
                const isExpanded = expandedIds.has(product.id);

                const effectivePrices = product.sizes.map((sz) => ({
                  purchase: parseFloat(String(sz.purchasePrice ?? product.purchasePrice)),
                  sale:     parseFloat(String(sz.salePrice     ?? product.salePrice)),
                  gain:     parseFloat(String(sz.salePrice     ?? product.salePrice)) - parseFloat(String(sz.purchasePrice ?? product.purchasePrice)),
                }));

                const hasOverrides = product.sizes.some((sz) => sz.salePrice != null || sz.purchasePrice != null);
                const minPurchase = Math.min(...effectivePrices.map((p) => p.purchase));
                const maxPurchase = Math.max(...effectivePrices.map((p) => p.purchase));
                const minSale     = Math.min(...effectivePrices.map((p) => p.sale));
                const maxSale     = Math.max(...effectivePrices.map((p) => p.sale));
                const minGain     = Math.min(...effectivePrices.map((p) => p.gain));
                const maxGain     = Math.max(...effectivePrices.map((p) => p.gain));

                function priceRange(min: number, max: number) {
                  if (!hasOverrides || min === max) return formatCurrency(min);
                  return `${formatCurrency(min)} – ${formatCurrency(max)}`;
                }

                return (
                  <Fragment key={product.id}>
                    {/* Fila principal */}
                    <tr
                      onClick={() => toggleExpand(product.id)}
                      className="hover:bg-zinc-900/50 transition-colors cursor-pointer select-none"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className={`text-zinc-500 text-xs transition-transform duration-150 shrink-0 ${isExpanded ? "rotate-90" : ""}`}>▶</span>
                          {/* Thumbnail */}
                          {product.images.length > 0 ? (
                            <button
                              onClick={(e) => { e.stopPropagation(); setCarousel({ images: product.images, index: 0 }); }}
                              className="shrink-0 w-10 h-10 rounded-lg overflow-hidden border border-zinc-700 hover:border-zinc-400 transition-colors"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                            </button>
                          ) : (
                            <div className="shrink-0 w-10 h-10 rounded-lg border border-zinc-800 bg-zinc-900 flex items-center justify-center text-zinc-700 text-xs">
                              📷
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-zinc-100">{product.brand} {product.model}</p>
                            <p className="text-xs text-zinc-500">{product.colorway}</p>
                            {(product.category || product.quality) && (
                              <div className="flex gap-1 mt-0.5">
                                {product.category && (
                                  <span className="inline-flex items-center rounded-full bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-400">{product.category.name}</span>
                                )}
                                {product.quality && (
                                  <span className="inline-flex items-center rounded-full bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-400">{product.quality.name}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={product.status} />
                          {isLowStock && (
                            <span className="inline-flex items-center rounded-full border border-yellow-500/20 bg-yellow-500/15 px-2 py-0.5 text-xs font-medium text-yellow-400">
                              ⚠️ Stock bajo
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {product.sizes.map((sz) => {
                            const hasOverride = sz.salePrice != null || sz.purchasePrice != null;
                            return (
                              <span
                                key={sz.id}
                                className={`text-xs px-1.5 py-0.5 rounded border ${
                                  sz.stock === 0
                                    ? "border-zinc-800 text-zinc-600 line-through"
                                    : hasOverride
                                    ? "border-yellow-600/50 text-yellow-300 bg-yellow-500/10"
                                    : "border-zinc-600 text-zinc-300"
                                }`}
                              >
                                {sz.size}
                              </span>
                            );
                          })}
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">{totalStock} unid.</p>
                      </td>
                      <td className="px-4 py-3 text-right text-zinc-400 tabular-nums">
                        {priceRange(minPurchase, maxPurchase)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums">
                        {priceRange(minSale, maxSale)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        <span className={minGain > 0 ? "text-emerald-400" : "text-red-400"}>
                          {priceRange(minGain, maxGain)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setEditProduct(product)}
                            className="text-xs text-zinc-400 hover:text-zinc-100 transition-colors px-2 py-1 rounded hover:bg-zinc-800"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => setDeleteProduct(product)}
                            className="text-xs text-zinc-600 hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-zinc-800"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Subfilas por talle */}
                    {isExpanded && product.sizes.map((sz) => {
                      const effPurchase = parseFloat(String(sz.purchasePrice ?? product.purchasePrice));
                      const effSale     = parseFloat(String(sz.salePrice     ?? product.salePrice));
                      const effGain     = effSale - effPurchase;
                      const hasOverride = sz.salePrice != null || sz.purchasePrice != null;
                      return (
                        <tr key={`${product.id}-${sz.id}`} className="bg-zinc-900/40 border-t border-zinc-800/50">
                          <td className="pl-10 pr-4 py-2">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-mono px-1.5 py-0.5 rounded border ${
                                sz.stock === 0
                                  ? "border-zinc-800 text-zinc-600"
                                  : hasOverride
                                  ? "border-yellow-600/50 text-yellow-300 bg-yellow-500/10"
                                  : "border-zinc-700 text-zinc-400"
                              }`}>
                                {sz.size}
                              </span>
                              <span className={`text-xs ${sz.stock === 0 ? "text-zinc-600" : sz.stock <= 1 ? "text-yellow-400" : "text-zinc-500"}`}>
                                {sz.stock} unid.
                              </span>
                              {hasOverride && (
                                <span className="text-xs text-yellow-500/70">precio propio</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2" />
                          <td className="px-4 py-2" />
                          <td className="px-4 py-2 text-right text-zinc-500 tabular-nums text-xs">
                            {formatCurrency(effPurchase)}
                          </td>
                          <td className="px-4 py-2 text-right text-zinc-300 tabular-nums text-xs">
                            {formatCurrency(effSale)}
                          </td>
                          <td className="px-4 py-2 text-right tabular-nums text-xs">
                            <span className={effGain > 0 ? "text-emerald-400/80" : "text-red-400/80"}>
                              {formatCurrency(effGain)}
                            </span>
                          </td>
                          <td className="px-4 py-2" />
                        </tr>
                      );
                    })}
                  </Fragment>
                );
              })}

            </tbody>
          </table>
        </div>
      )}

      {/* Paginación */}
      {result && result.totalPages > 1 && !search && (
        <Pagination
          page={result.page}
          totalPages={result.totalPages}
          total={result.total}
          limit={20}
          onPageChange={setPage}
        />
      )}

      {/* Modal crear */}
      <Modal open={createOpen} onClose={() => { setCreateOpen(false); setCreateError(""); }} title="Nuevo producto">
        <ProductForm
          key={createOpen ? "open" : "closed"}
          onSubmit={handleCreate}
          loading={createProduct.isPending}
          error={createError}
        />
      </Modal>

      {/* Modal editar */}
      <Modal open={!!editProduct} onClose={() => setEditProduct(null)} title="Editar producto">
        {editProduct && (
          <EditProductWrapper
            key={editProduct.id}
            product={editProduct}
            onClose={() => setEditProduct(null)}
          />
        )}
      </Modal>

      {/* Confirmar eliminar */}
      <ConfirmDialog
        open={!!deleteProduct}
        title="Eliminar producto"
        description={deleteProduct ? `¿Eliminar "${deleteProduct.brand} ${deleteProduct.model}"? Esta acción no se puede deshacer.` : ""}
        loading={deleteProductMutation.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteProduct(null)}
      />

      {/* Carrusel de imágenes */}
      {carousel && (
        <ImageCarousel
          images={carousel.images}
          initialIndex={carousel.index}
          onClose={() => setCarousel(null)}
        />
      )}
    </div>
  );
}
