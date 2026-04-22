"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Plus, Save, Trash2 } from "lucide-react";

import { api } from "@/lib/api";
import {
  AdminLookupData,
  AdminPaginatedProducts,
  AdminProductDetail,
  AdminProductVariant
} from "@/types/admin";

interface ProductFormState {
  name: string;
  sku: string;
  description: string;
  short_description: string;
  category: string;
  brand: string;
  price: string;
  sale_price: string;
  weight: string;
  is_active: boolean;
  is_featured: boolean;
}

interface VariantFormState {
  size: string;
  color_name: string;
  color_hex: string;
  sku: string;
  stock_quantity: string;
  price_adjustment: string;
}

const emptyProductForm: ProductFormState = {
  name: "",
  sku: "",
  description: "",
  short_description: "",
  category: "",
  brand: "",
  price: "",
  sale_price: "",
  weight: "",
  is_active: true,
  is_featured: false
};

const emptyVariantForm: VariantFormState = {
  size: "",
  color_name: "",
  color_hex: "#000000",
  sku: "",
  stock_quantity: "0",
  price_adjustment: "0.00"
};

export default function AdminProductsPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [page, setPage] = useState(1);

  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [productForm, setProductForm] = useState<ProductFormState>(emptyProductForm);
  const [productImageFile, setProductImageFile] = useState<File | null>(null);

  const [variantForm, setVariantForm] = useState<VariantFormState>(emptyVariantForm);
  const [variantDrafts, setVariantDrafts] = useState<Record<number, { stock_quantity: string; price_adjustment: string }>>({});

  const isEditorOpen = isCreating || editingProductId !== null;

  const lookupsQuery = useQuery({
    queryKey: ["admin-lookups"],
    queryFn: async () => {
      const response = await api.get<AdminLookupData>("/admin/lookups/");
      return response.data;
    }
  });

  const productsQuery = useQuery({
    queryKey: ["admin-products", page, search, statusFilter],
    queryFn: async () => {
      const params: Record<string, string | number> = { page };
      if (search.trim()) {
        params.search = search.trim();
      }
      if (statusFilter === "active") {
        params.is_active = "true";
      }
      if (statusFilter === "inactive") {
        params.is_active = "false";
      }

      const response = await api.get<AdminPaginatedProducts>("/admin/products/", { params });
      return response.data;
    }
  });

  const selectedProductQuery = useQuery({
    queryKey: ["admin-product-detail", editingProductId],
    queryFn: async () => {
      const response = await api.get<AdminProductDetail>(`/admin/products/${editingProductId}/`);
      return response.data;
    },
    enabled: editingProductId !== null
  });

  useEffect(() => {
    if (!selectedProductQuery.data) {
      return;
    }

    const product = selectedProductQuery.data;
    setProductForm({
      name: product.name,
      sku: product.sku,
      description: product.description,
      short_description: product.short_description,
      category: String(product.category.id),
      brand: String(product.brand.id),
      price: product.price,
      sale_price: product.sale_price || "",
      weight: product.weight || "",
      is_active: product.is_active,
      is_featured: product.is_featured
    });

    const draftMap: Record<number, { stock_quantity: string; price_adjustment: string }> = {};
    product.variants.forEach((variant) => {
      draftMap[variant.id] = {
        stock_quantity: String(variant.stock_quantity),
        price_adjustment: String(variant.price_adjustment)
      };
    });
    setVariantDrafts(draftMap);
  }, [selectedProductQuery.data]);

  useEffect(() => {
    if (productsQuery.data && productsQuery.data.results.length === 0 && page > 1) {
      setPage(1);
    }
  }, [productsQuery.data, page]);

  const createProductMutation = useMutation({
    mutationFn: async (payload: FormData) => {
      const response = await api.post<AdminProductDetail>("/admin/products/", payload, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      setProductForm(emptyProductForm);
      setProductImageFile(null);
      setIsCreating(false);
    }
  });

  const updateProductMutation = useMutation({
    mutationFn: async (payload: FormData) => {
      const response = await api.patch<AdminProductDetail>(`/admin/products/${editingProductId}/`, payload, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-product-detail", editingProductId] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
    }
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/admin/products/${id}/`);
    },
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      if (editingProductId === deletedId) {
        setEditingProductId(null);
      }
    }
  });

  const createVariantMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      if (!editingProductId) {
        return;
      }
      await api.post(`/admin/products/${editingProductId}/variants/`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-product-detail", editingProductId] });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      setVariantForm(emptyVariantForm);
    }
  });

  const updateVariantMutation = useMutation({
    mutationFn: async ({ variantId, payload }: { variantId: number; payload: Record<string, unknown> }) => {
      await api.patch(`/admin/products/variants/${variantId}/`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-product-detail", editingProductId] });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
    }
  });

  const deleteVariantMutation = useMutation({
    mutationFn: async (variantId: number) => {
      await api.delete(`/admin/products/variants/${variantId}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-product-detail", editingProductId] });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
    }
  });

  const isBusy =
    createProductMutation.isPending ||
    updateProductMutation.isPending ||
    deleteProductMutation.isPending ||
    createVariantMutation.isPending ||
    updateVariantMutation.isPending ||
    deleteVariantMutation.isPending;

  const pageCount = useMemo(() => {
    if (!productsQuery.data) {
      return 1;
    }
    return Math.max(1, Math.ceil(productsQuery.data.count / 12));
  }, [productsQuery.data]);

  const handleProductInputChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, type } = event.target;
    const value = type === "checkbox" ? (event.target as HTMLInputElement).checked : event.target.value;
    setProductForm((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  const handleVariantInputChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setVariantForm((previous) => ({ ...previous, [name]: value }));
  };

  const openCreateEditor = () => {
    setIsCreating(true);
    setEditingProductId(null);
    setProductForm(emptyProductForm);
    setProductImageFile(null);
    setVariantForm(emptyVariantForm);
    setVariantDrafts({});
  };

  const openEditEditor = (id: number) => {
    setIsCreating(false);
    setEditingProductId(id);
    setProductImageFile(null);
    setVariantForm(emptyVariantForm);
  };

  const closeEditor = () => {
    setIsCreating(false);
    setEditingProductId(null);
    setProductForm(emptyProductForm);
    setProductImageFile(null);
    setVariantForm(emptyVariantForm);
    setVariantDrafts({});
  };

  const buildProductPayload = () => {
    const payload = new FormData();
    payload.append("name", productForm.name);
    payload.append("sku", productForm.sku);
    payload.append("description", productForm.description);
    payload.append("short_description", productForm.short_description);
    payload.append("category", productForm.category);
    payload.append("brand", productForm.brand);
    payload.append("price", productForm.price);
    payload.append("sale_price", productForm.sale_price);
    payload.append("weight", productForm.weight);
    payload.append("is_active", String(productForm.is_active));
    payload.append("is_featured", String(productForm.is_featured));
    if (productImageFile) {
      payload.append("image", productImageFile);
      payload.append("image_alt", productForm.name);
    }
    return payload;
  };

  const handleProductSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = buildProductPayload();

    if (isCreating) {
      createProductMutation.mutate(payload);
      return;
    }

    if (editingProductId) {
      updateProductMutation.mutate(payload);
    }
  };

  const handleVariantDraftChange = (
    variant: AdminProductVariant,
    key: "stock_quantity" | "price_adjustment",
    value: string
  ) => {
    setVariantDrafts((previous) => ({
      ...previous,
      [variant.id]: {
        ...previous[variant.id],
        stock_quantity: key === "stock_quantity" ? value : previous[variant.id]?.stock_quantity ?? String(variant.stock_quantity),
        price_adjustment:
          key === "price_adjustment" ? value : previous[variant.id]?.price_adjustment ?? String(variant.price_adjustment)
      }
    }));
  };

  const selectedProduct = selectedProductQuery.data;

  return (
    <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
      <section className="admin-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-red-200/70">Catalog Management</p>
            <h1 className="mt-2 text-2xl font-semibold text-white">Products</h1>
          </div>

          <button
            onClick={openCreateEditor}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-800 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white"
          >
            <Plus size={15} /> New Product
          </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search by product name or SKU"
            className="h-11 rounded-xl border border-slate-700 bg-slate-950/70 px-4 text-sm text-white"
          />

          <select
            value={statusFilter}
            onChange={(event) => {
              const value = event.target.value as "all" | "active" | "inactive";
              setStatusFilter(value);
              setPage(1);
            }}
            className="h-11 rounded-xl border border-slate-700 bg-slate-950/70 px-3 text-sm text-white"
          >
            <option value="all">All statuses</option>
            <option value="active">Active only</option>
            <option value="inactive">Inactive only</option>
          </select>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] border-separate border-spacing-y-2 text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.2em] text-slate-400">
                <th className="px-3 py-2">Product</th>
                <th className="px-3 py-2">SKU</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">Stock</th>
                <th className="px-3 py-2">Price</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {productsQuery.data?.results.map((product) => (
                <tr key={product.id} className="rounded-xl bg-slate-900/65">
                  <td className="px-3 py-3">
                    <p className="font-semibold text-white">{product.name}</p>
                    <p className="text-xs text-slate-400">{product.brand.name}</p>
                  </td>
                  <td className="px-3 py-3 text-slate-300">{product.sku}</td>
                  <td className="px-3 py-3 text-slate-300">{product.category.name}</td>
                  <td className="px-3 py-3 text-slate-200">{product.total_stock}</td>
                  <td className="px-3 py-3 text-slate-200">
                    ${Number(product.sale_price || product.price).toFixed(2)}
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                        product.is_active
                          ? "bg-emerald-500/15 text-emerald-200"
                          : "bg-slate-500/20 text-slate-300"
                      }`}
                    >
                      {product.is_active ? "active" : "inactive"}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <button
                        onClick={() => openEditEditor(product.id)}
                        className="rounded-lg border border-red-400/30 bg-red-500/10 p-2 text-red-200"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm("Delete this product? This cannot be undone.")) {
                            deleteProductMutation.mutate(product.id);
                          }
                        }}
                        className="rounded-lg border border-rose-400/30 bg-rose-500/10 p-2 text-rose-200"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {productsQuery.isLoading ? (
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-300">
              <Loader2 className="animate-spin" size={16} /> Loading products...
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-slate-400">{productsQuery.data?.count || 0} products</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-slate-700 px-3 py-2 text-xs uppercase tracking-[0.18em] text-slate-300 disabled:opacity-50"
            >
              Prev
            </button>
            <span className="text-xs text-slate-400">Page {page} of {pageCount}</span>
            <button
              onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
              disabled={page >= pageCount}
              className="rounded-lg border border-slate-700 px-3 py-2 text-xs uppercase tracking-[0.18em] text-slate-300 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </section>

      <aside className="admin-card p-5">
        {!isEditorOpen ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="text-sm text-slate-400">Select a product to edit details and variants, or create a new product.</p>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleProductSubmit}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">{isCreating ? "Create Product" : "Edit Product"}</h2>
              <button type="button" onClick={closeEditor} className="text-xs uppercase tracking-[0.2em] text-slate-400 hover:text-slate-200">
                Close
              </button>
            </div>

            <div className="grid gap-3">
              <label className="space-y-1 text-xs uppercase tracking-[0.16em] text-slate-400">
                Name
                <input
                  name="name"
                  value={productForm.name}
                  onChange={handleProductInputChange}
                  className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 text-sm text-white"
                  required
                />
              </label>

              <label className="space-y-1 text-xs uppercase tracking-[0.16em] text-slate-400">
                SKU
                <input
                  name="sku"
                  value={productForm.sku}
                  onChange={handleProductInputChange}
                  className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 text-sm text-white"
                  required
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1 text-xs uppercase tracking-[0.16em] text-slate-400">
                  Category
                  <select
                    name="category"
                    value={productForm.category}
                    onChange={handleProductInputChange}
                    className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 text-sm text-white"
                    required
                  >
                    <option value="">Select category</option>
                    {lookupsQuery.data?.categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1 text-xs uppercase tracking-[0.16em] text-slate-400">
                  Brand
                  <select
                    name="brand"
                    value={productForm.brand}
                    onChange={handleProductInputChange}
                    className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 text-sm text-white"
                    required
                  >
                    <option value="">Select brand</option>
                    {lookupsQuery.data?.brands.map((brand) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <label className="space-y-1 text-xs uppercase tracking-[0.16em] text-slate-400">
                  Price
                  <input
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={productForm.price}
                    onChange={handleProductInputChange}
                    className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 text-sm text-white"
                    required
                  />
                </label>

                <label className="space-y-1 text-xs uppercase tracking-[0.16em] text-slate-400">
                  Sale price
                  <input
                    name="sale_price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={productForm.sale_price}
                    onChange={handleProductInputChange}
                    className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 text-sm text-white"
                  />
                </label>

                <label className="space-y-1 text-xs uppercase tracking-[0.16em] text-slate-400">
                  Weight
                  <input
                    name="weight"
                    type="number"
                    min="0"
                    step="0.01"
                    value={productForm.weight}
                    onChange={handleProductInputChange}
                    className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 text-sm text-white"
                  />
                </label>
              </div>

              <label className="space-y-1 text-xs uppercase tracking-[0.16em] text-slate-400">
                Short description
                <input
                  name="short_description"
                  value={productForm.short_description}
                  onChange={handleProductInputChange}
                  className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 text-sm text-white"
                  required
                />
              </label>

              <label className="space-y-1 text-xs uppercase tracking-[0.16em] text-slate-400">
                Description
                <textarea
                  name="description"
                  value={productForm.description}
                  onChange={handleProductInputChange}
                  className="min-h-24 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white"
                  required
                />
              </label>

              <label className="space-y-1 text-xs uppercase tracking-[0.16em] text-slate-400">
                Product photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => setProductImageFile(event.target.files?.[0] || null)}
                  className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white file:mr-3 file:rounded-md file:border-0 file:bg-red-700 file:px-3 file:py-1 file:text-xs file:font-semibold file:uppercase file:tracking-[0.16em] file:text-white"
                />
                <p className="text-[11px] normal-case tracking-normal text-slate-500">
                  {productImageFile ? `Selected: ${productImageFile.name}` : "Choose an image from your device"}
                </p>
              </label>

              <div className="grid gap-2 sm:grid-cols-2">
                <label className="flex items-center gap-2 text-xs text-slate-300">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={productForm.is_active}
                    onChange={handleProductInputChange}
                  />
                  Active
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-300">
                  <input
                    type="checkbox"
                    name="is_featured"
                    checked={productForm.is_featured}
                    onChange={handleProductInputChange}
                  />
                  Featured
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={isBusy}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-800 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white disabled:opacity-60"
            >
              <Save size={14} /> {isCreating ? "Create Product" : "Save Product"}
            </button>

            {editingProductId && selectedProduct ? (
              <div className="mt-6 space-y-3 border-t border-slate-800 pt-5">
                <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-200">Variants</h3>

                {selectedProduct.variants.map((variant) => {
                  const draft = variantDrafts[variant.id] || {
                    stock_quantity: String(variant.stock_quantity),
                    price_adjustment: String(variant.price_adjustment)
                  };

                  return (
                    <div key={variant.id} className="rounded-xl border border-slate-700 bg-slate-950/70 p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-white">{variant.size} / {variant.color_name}</p>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm("Delete this variant?")) {
                              deleteVariantMutation.mutate(variant.id);
                            }
                          }}
                          className="rounded-lg border border-rose-400/30 bg-rose-500/10 p-2 text-rose-200"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>

                      <p className="mt-1 text-xs text-slate-400">{variant.sku}</p>

                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <input
                          type="number"
                          min="0"
                          value={draft.stock_quantity}
                          onChange={(event) => handleVariantDraftChange(variant, "stock_quantity", event.target.value)}
                          className="h-9 rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-white"
                          placeholder="Stock"
                        />
                        <input
                          type="number"
                          step="0.01"
                          value={draft.price_adjustment}
                          onChange={(event) => handleVariantDraftChange(variant, "price_adjustment", event.target.value)}
                          className="h-9 rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-white"
                          placeholder="Price adjustment"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          updateVariantMutation.mutate({
                            variantId: variant.id,
                            payload: {
                              stock_quantity: Number(draft.stock_quantity),
                              price_adjustment: draft.price_adjustment
                            }
                          })
                        }
                        className="mt-3 inline-flex items-center gap-1 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-red-200"
                      >
                        <Save size={12} /> Update variant
                      </button>
                    </div>
                  );
                })}

                <div className="rounded-xl border border-slate-700 bg-slate-900/55 p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Add Variant</p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <input
                      name="size"
                      value={variantForm.size}
                      onChange={handleVariantInputChange}
                      placeholder="Size (42)"
                      className="h-9 rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-white"
                    />
                    <input
                      name="color_name"
                      value={variantForm.color_name}
                      onChange={handleVariantInputChange}
                      placeholder="Color name"
                      className="h-9 rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-white"
                    />
                    <input
                      name="color_hex"
                      value={variantForm.color_hex}
                      onChange={handleVariantInputChange}
                      placeholder="#000000"
                      className="h-9 rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-white"
                    />
                    <input
                      name="sku"
                      value={variantForm.sku}
                      onChange={handleVariantInputChange}
                      placeholder="Variant SKU"
                      className="h-9 rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-white"
                    />
                    <input
                      name="stock_quantity"
                      type="number"
                      min="0"
                      value={variantForm.stock_quantity}
                      onChange={handleVariantInputChange}
                      placeholder="Stock"
                      className="h-9 rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-white"
                    />
                    <input
                      name="price_adjustment"
                      type="number"
                      step="0.01"
                      value={variantForm.price_adjustment}
                      onChange={handleVariantInputChange}
                      placeholder="Price adjustment"
                      className="h-9 rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      createVariantMutation.mutate({
                        size: variantForm.size,
                        color_name: variantForm.color_name,
                        color_hex: variantForm.color_hex,
                        sku: variantForm.sku,
                        stock_quantity: Number(variantForm.stock_quantity),
                        price_adjustment: variantForm.price_adjustment
                      })
                    }
                    className="mt-3 inline-flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-red-200"
                  >
                    <Plus size={12} /> Add variant
                  </button>
                </div>
              </div>
            ) : null}
          </form>
        )}
      </aside>
    </div>
  );
}
