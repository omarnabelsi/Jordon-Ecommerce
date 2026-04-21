"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { useProducts } from "@/hooks/use-products";
import { getApiErrorMessage } from "@/lib/api-error";
import { api } from "@/lib/api";
import { Product } from "@/types";

import { ProductCard } from "../product/product-card";
import { Input } from "../ui/input";

export function ProductsCatalog() {
  const searchParams = useSearchParams();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [sort, setSort] = useState("newest");
  const [available, setAvailable] = useState(false);
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [catalogItems, setCatalogItems] = useState<Product[]>([]);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const urlCategory = searchParams.get("category") || "";
    setCategory(urlCategory);
  }, [searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const filters = useMemo(
    () => ({
      page,
      search: debouncedSearch || undefined,
      category: category || undefined,
      brand: brand || undefined,
      size: size || undefined,
      color: color || undefined,
      available: available || undefined,
      min_price: minPrice,
      max_price: maxPrice,
      sort
    }),
    [page, debouncedSearch, category, brand, size, color, available, minPrice, maxPrice, sort]
  );

  const { data, isLoading, isFetching, error: productsError } = useProducts(filters);

  const { data: categories, error: categoriesError } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await api.get("/products/categories/");
      return response.data.results ?? response.data;
    }
  });

  const { data: brands, error: brandsError } = useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      const response = await api.get("/products/brands/");
      return response.data.results ?? response.data;
    }
  });

  const productsErrorMessage = productsError
    ? getApiErrorMessage(productsError, "Unable to load products right now.")
    : null;
  const categoriesErrorMessage = categoriesError
    ? getApiErrorMessage(categoriesError, "Unable to load categories.")
    : null;
  const brandsErrorMessage = brandsError
    ? getApiErrorMessage(brandsError, "Unable to load brands.")
    : null;

  useEffect(() => {
    setPage(1);
    setCatalogItems([]);
  }, [debouncedSearch, category, brand, size, color, available, minPrice, maxPrice, sort]);

  useEffect(() => {
    if (!data) return;
    if (page === 1) {
      setCatalogItems(data.results);
      return;
    }

    setCatalogItems((prev) => {
      const map = new Map(prev.map((item) => [item.id, item]));
      data.results.forEach((item) => map.set(item.id, item));
      return Array.from(map.values());
    });
  }, [data, page]);

  useEffect(() => {
    if (!sentinelRef.current || !data?.next) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetching) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(sentinelRef.current);

    return () => observer.disconnect();
  }, [data?.next, isFetching]);

  return (
    <section className="container-shell py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-red-400">Catalog</p>
          <h1 className="font-display text-5xl uppercase tracking-wide">Sneakers</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("grid")}
            className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] ${
              viewMode === "grid" ? "bg-red-600 text-white" : "border border-white/30 text-white/70"
            }`}
          >
            Grid
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] ${
              viewMode === "list" ? "bg-red-600 text-white" : "border border-white/30 text-white/70"
            }`}
          >
            List
          </button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="card-surface h-fit space-y-4 p-5">
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search sneakers..."
          />

          <select value={category} onChange={(event) => setCategory(event.target.value)} className="focus-ring h-10 w-full rounded-lg border border-white/20 bg-black px-3 text-sm text-white">
            <option value="">All Categories</option>
            {(categories || []).map((item: { slug: string; name: string }) => (
              <option key={item.slug} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>

          <select value={brand} onChange={(event) => setBrand(event.target.value)} className="focus-ring h-10 w-full rounded-lg border border-white/20 bg-black px-3 text-sm text-white">
            <option value="">All Brands</option>
            {(brands || []).map((item: { slug: string; name: string }) => (
              <option key={item.slug} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>

          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              placeholder="Min $"
              onChange={(event) => setMinPrice(event.target.value ? Number(event.target.value) : undefined)}
            />
            <Input
              type="number"
              placeholder="Max $"
              onChange={(event) => setMaxPrice(event.target.value ? Number(event.target.value) : undefined)}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Size" value={size} onChange={(event) => setSize(event.target.value)} />
            <Input placeholder="Color" value={color} onChange={(event) => setColor(event.target.value)} />
          </div>

          <select value={sort} onChange={(event) => setSort(event.target.value)} className="focus-ring h-10 w-full rounded-lg border border-white/20 bg-black px-3 text-sm text-white">
            <option value="newest">Newest</option>
            <option value="price_low_high">Price: Low to High</option>
            <option value="price_high_low">Price: High to Low</option>
            <option value="best_sellers">Best Sellers</option>
          </select>

          <label className="flex items-center gap-2 text-sm text-white/80">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={available}
              onChange={(event) => setAvailable(event.target.checked)}
            />
            In stock only
          </label>
        </aside>

        <div>
          {isLoading ? <p className="text-white/60">Loading products...</p> : null}
          {productsErrorMessage ? (
            <p className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {productsErrorMessage}
            </p>
          ) : null}
          {categoriesErrorMessage ? (
            <p className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              {categoriesErrorMessage}
            </p>
          ) : null}
          {brandsErrorMessage ? (
            <p className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              {brandsErrorMessage}
            </p>
          ) : null}

          <div className={viewMode === "grid" ? "grid gap-5 sm:grid-cols-2 xl:grid-cols-3" : "space-y-4"}>
            {catalogItems.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.02 }}
              >
                <ProductCard product={product} priority={index < 3} />
              </motion.div>
            ))}
          </div>

          <div ref={sentinelRef} className="h-12" />
          {isFetching ? <p className="text-center text-sm text-white/50">Loading more...</p> : null}
        </div>
      </div>
    </section>
  );
}
