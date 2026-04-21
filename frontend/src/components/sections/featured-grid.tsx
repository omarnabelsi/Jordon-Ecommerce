"use client";

import { motion } from "framer-motion";
import { ArrowUpDown } from "lucide-react";
import { useMemo, useState } from "react";

import { useFeaturedProducts } from "@/hooks/use-products";
import { Product } from "@/types";

import { ProductCardSkeleton } from "../product/product-card-skeleton";
import { ProductCard } from "../product/product-card";

const fallbackProducts = [
  {
    id: 1,
    slug: "jordan-jumpman-2021-pf",
    name: "Jordan Jumpman 2021 PF",
    description: "",
    short_description: "Premium basketball sneaker",
    price: "134.00",
    sale_price: null,
    current_price: "134.00",
    sku: "JMP-PF-001",
    is_featured: true,
    primary_image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
    category: { id: 1, name: "Basketball", slug: "basketball" },
    brand: { id: 1, name: "Jordan", slug: "jordan" }
  },
  {
    id: 2,
    slug: "nike-air-velocity",
    name: "Nike Air Velocity",
    description: "",
    short_description: "Daily acceleration runner",
    price: "159.00",
    sale_price: "139.00",
    current_price: "139.00",
    sku: "AIR-V-002",
    is_featured: true,
    primary_image:
      "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=900&q=80",
    category: { id: 2, name: "Running", slug: "running" },
    brand: { id: 2, name: "Nike", slug: "nike" }
  },
  {
    id: 3,
    slug: "jordan-court-elevate",
    name: "Jordan Court Elevate",
    description: "",
    short_description: "Street-luxe silhouette",
    price: "172.00",
    sale_price: null,
    current_price: "172.00",
    sku: "CR-E-003",
    is_featured: true,
    primary_image:
      "https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=900&q=80",
    category: { id: 3, name: "Lifestyle", slug: "lifestyle" },
    brand: { id: 1, name: "Jordan", slug: "jordan" }
  }
];

const categoryFilters = [
  { value: "all", label: "All" },
  { value: "men", label: "Men" },
  { value: "women", label: "Women" },
  { value: "shoes", label: "Shoes" },
  { value: "clothing", label: "Clothing" }
];

const sortOptions = [
  { value: "popularity", label: "Popularity" },
  { value: "newest", label: "Newest" },
  { value: "price_low", label: "Price: Low to High" },
  { value: "price_high", label: "Price: High to Low" }
];

function toAmount(value: string | number | null | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function matchesCategory(product: Product, category: string) {
  if (category === "all") return true;

  // Combine key product fields so marketing category chips can map to varied backend labels.
  const haystack = [
    product.category?.name,
    product.category?.slug,
    product.name,
    product.short_description,
    product.description
  ]
    .join(" ")
    .toLowerCase();

  if (category === "shoes") {
    return /(shoe|sneaker|runner|court|air|jumpman)/.test(haystack);
  }

  if (category === "clothing") {
    return /(cloth|apparel|hoodie|shirt|tee|jacket|pant)/.test(haystack);
  }

  return haystack.includes(category);
}

function popularityScore(product: Product) {
  const saleBoost = product.sale_price ? 22 : 0;
  const featuredBoost = product.is_featured ? 26 : 8;
  const idSignal = Math.max(0, 20 - (product.id % 20));
  return saleBoost + featuredBoost + idSignal;
}

export function FeaturedGrid() {
  const { data, isLoading } = useFeaturedProducts();
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("popularity");

  const products = data && data.length > 0 ? data : fallbackProducts;

  const visibleProducts = useMemo(() => {
    const filtered = products.filter((product) => matchesCategory(product, categoryFilter));
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "price_low") {
        return toAmount(a.current_price) - toAmount(b.current_price);
      }
      if (sortBy === "price_high") {
        return toAmount(b.current_price) - toAmount(a.current_price);
      }
      if (sortBy === "newest") {
        return b.id - a.id;
      }
      return popularityScore(b) - popularityScore(a);
    });
    return sorted;
  }, [products, categoryFilter, sortBy]);

  return (
    <section id="top-drops" className="container-shell py-16 lg:py-20">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.35em] text-red-400">Featured Rotation</p>
          <h2 className="font-display text-5xl uppercase tracking-wider text-white">Top Drops</h2>
          <p className="max-w-xl text-sm text-white/60">
            Curated best performers with fast checkout actions and trend-first filtering.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:items-end">
          <div className="flex flex-wrap items-center gap-2">
            {categoryFilters.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setCategoryFilter(item.value)}
                className={`focus-ring rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition ${
                  categoryFilter === item.value
                    ? "bg-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.45)]"
                    : "border border-white/20 text-white/75 hover:border-white/45 hover:text-white"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-white/60">
            <ArrowUpDown size={14} />
            Sort
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="focus-ring h-10 rounded-full border border-white/20 bg-black/70 px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-white"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <motion.div
              key={`skeleton-${index}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
            >
              <ProductCardSkeleton />
            </motion.div>
          ))}
        </div>
      ) : null}

      {!isLoading && visibleProducts.length === 0 ? (
        <div className="card-surface rounded-2xl border border-white/10 px-6 py-8 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-white/60">No drops found for this filter</p>
          <button
            type="button"
            onClick={() => setCategoryFilter("all")}
            className="mt-4 rounded-full bg-red-600 px-5 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-red-500"
          >
            Reset Filters
          </button>
        </div>
      ) : null}

      {!isLoading && visibleProducts.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {visibleProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.35, delay: index * 0.05 }}
            >
              <ProductCard product={product} priority={index < 3} />
            </motion.div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
