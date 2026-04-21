"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useCart } from "@/hooks/use-cart";
import { useFeaturedProducts, useProductDetail } from "@/hooks/use-products";

import { ProductCard } from "./product-card";

interface ProductDetailClientProps {
  slug: string;
}

export function ProductDetailClient({ slug }: ProductDetailClientProps) {
  const router = useRouter();
  const { data: product, isLoading } = useProductDetail(slug);
  const { data: relatedProducts } = useFeaturedProducts();
  const { addToCart } = useCart();

  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [tab, setTab] = useState<"description" | "specifications" | "shipping">("description");
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const selectedVariant = useMemo(() => product?.variants?.[selectedVariantIndex], [product, selectedVariantIndex]);
  const selectedImage = useMemo(() => {
    const images = product?.images || [];
    const primaryImage = images.find((image) => image.is_primary)?.image;

    return (
      primaryImage ||
      images[0]?.image ||
      product?.primary_image ||
      "https://images.pexels.com/photos/6311605/pexels-photo-6311605.jpeg?auto=compress&cs=tinysrgb&w=900"
    );
  }, [product?.images, product?.primary_image]);

  useEffect(() => {
    const variants = product?.variants || [];
    if (!variants.length) return;
    if (selectedVariant?.is_in_stock) return;

    const firstInStockIndex = variants.findIndex((variant) => variant.is_in_stock);
    if (firstInStockIndex >= 0) {
      setSelectedVariantIndex(firstInStockIndex);
      return;
    }

    setSelectedVariantIndex(0);
  }, [product?.variants, selectedVariant?.is_in_stock]);

  const uniqueColors = useMemo(() => {
    if (!product?.variants) return [];
    const seen = new Set<string>();
    return product.variants.filter((v) => {
      if (seen.has(v.color_name)) return false;
      seen.add(v.color_name);
      return true;
    });
  }, [product?.variants]);

  const getErrorMessage = (error: unknown, fallback: string) => {
    if (!error || typeof error !== "object") return fallback;
    const maybeResponse = (error as { response?: { data?: { detail?: string } } }).response;
    return maybeResponse?.data?.detail || fallback;
  };

  const selectedColorName = selectedVariant?.color_name;

  const sizesByColor = useMemo(() => {
    if (!product?.variants || !selectedColorName) return [];
    return product.variants.filter((v) => v.color_name === selectedColorName);
  }, [product?.variants, selectedColorName]);

  if (isLoading || !product) {
    return <div className="container-shell py-16 text-white/60">Loading product details...</div>;
  }

  return (
    <div className="container-shell space-y-12 py-12">
      <section className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="card-surface relative h-[420px] overflow-hidden rounded-2xl">
            <Image
              src={selectedImage}
              alt={product.name}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover transition duration-500 hover:scale-105"
              priority
            />
            <div className="pointer-events-none absolute inset-0 bg-black/5" />
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-red-400">{product.brand.name}</p>
            <h1 className="font-display text-5xl uppercase leading-[1.1] text-white">{product.name}</h1>
            <p className="mt-3 text-white/70">{product.short_description}</p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-4xl font-extrabold text-red-500">${product.current_price}</span>
            {product.sale_price ? <span className="text-lg text-white/45 line-through">${product.price}</span> : null}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.24em] text-white/60">Color</p>
              {selectedVariant && <span className="text-xs text-white/50">{selectedVariant.color_name}</span>}
            </div>
            <div className="flex flex-wrap gap-3">
              {uniqueColors.map((variant) => (
                <button
                  key={variant.id}
                  onClick={() => {
                    const firstSizeIndex =
                      product.variants!.findIndex((v) => v.color_name === variant.color_name && v.is_in_stock) >= 0
                        ? product.variants!.findIndex((v) => v.color_name === variant.color_name && v.is_in_stock)
                        : product.variants!.findIndex((v) => v.color_name === variant.color_name);
                    setSelectedVariantIndex(firstSizeIndex);
                    setActionMessage(null);
                  }}
                  className={`group relative flex h-12 w-12 items-center justify-center rounded-full border-2 transition ${
                    selectedVariant?.color_name === variant.color_name ? "border-red-500" : "border-white/30 hover:border-white/60"
                  }`}
                  title={variant.color_name}
                >
                  <div className="h-10 w-10 rounded-full transition group-hover:scale-110" style={{ backgroundColor: variant.color_hex || "#888888" }} />
                </button>
              ))}
            </div>
          </div>

          {sizesByColor.length > 1 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.24em] text-white/60">Size</p>
                {selectedVariant && <span className="text-xs text-white/50">{selectedVariant.size}</span>}
              </div>
              <div className="flex flex-wrap gap-2">
                {sizesByColor.map((variant) => {
                  const variantIndex = product.variants!.findIndex((v) => v.id === variant.id);
                  return (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariantIndex(variantIndex)}
                      disabled={!variant.is_in_stock}
                      className={`rounded-lg border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                        selectedVariantIndex === variantIndex
                          ? "border-red-500 bg-red-500/15 text-white"
                          : variant.is_in_stock
                            ? "border-white/25 text-white/80 hover:border-white/50"
                            : "border-white/10 text-white/30 opacity-50"
                      }`}
                    >
                      {variant.size}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <p className="text-sm font-medium">
            {selectedVariant?.is_in_stock ? (
              <span className="text-emerald-400">In Stock ({selectedVariant.stock_quantity} available)</span>
            ) : (
              <span className="text-red-400">Out of Stock</span>
            )}
          </p>

          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-full border border-white/25">
              <button onClick={() => setQuantity((prev) => Math.max(1, prev - 1))} className="px-4 py-2 text-white hover:bg-white/10">
                -
              </button>
              <span className="min-w-10 text-center text-sm font-semibold">{quantity}</span>
              <button onClick={() => setQuantity((prev) => prev + 1)} className="px-4 py-2 text-white hover:bg-white/10">
                +
              </button>
            </div>
            <button
              onClick={async () => {
                if (!selectedVariant) {
                  setActionMessage({ type: "error", text: "Please select a size and color first." });
                  return;
                }

                if (!selectedVariant.is_in_stock) {
                  setActionMessage({ type: "error", text: "This variant is out of stock. Please choose another one." });
                  return;
                }

                setActionMessage(null);

                try {
                  await addToCart.mutateAsync({ product_variant_id: selectedVariant.id, quantity });
                  setQuantity(1);
                  setActionMessage({ type: "success", text: "Added to cart successfully." });
                } catch (error) {
                  setActionMessage({ type: "error", text: getErrorMessage(error, "Could not add to cart. Please try again.") });
                }
              }}
              className="focus-ring flex-1 rounded-full bg-white px-7 py-3 text-xs font-bold uppercase tracking-[0.22em] text-black transition hover:bg-red-500 hover:text-white disabled:opacity-50"
              disabled={addToCart.isPending}
            >
              {addToCart.isPending ? "Adding..." : "Add to Cart"}
            </button>
            <button
              onClick={async () => {
                if (!selectedVariant || !selectedVariant.is_in_stock) {
                  setActionMessage({ type: "error", text: "Please select an in-stock variant first." });
                  return;
                }

                setActionMessage(null);

                try {
                  await addToCart.mutateAsync({ product_variant_id: selectedVariant.id, quantity });
                  router.push("/checkout");
                } catch (error) {
                  setActionMessage({ type: "error", text: getErrorMessage(error, "Could not continue to checkout. Please try again.") });
                }
              }}
              disabled={addToCart.isPending}
              className="focus-ring rounded-full border-2 border-red-500 px-7 py-3 text-xs font-bold uppercase tracking-[0.22em] text-red-500 transition hover:bg-red-500 hover:text-white disabled:opacity-50"
            >
              Buy Now
            </button>
          </div>

          {actionMessage ? (
            <p className={`text-sm ${actionMessage.type === "success" ? "text-emerald-400" : "text-red-300"}`}>
              {actionMessage.text}
            </p>
          ) : null}
        </div>
      </section>

      <section className="card-surface p-6">
        <div className="mb-4 flex gap-2 border-b border-white/10 pb-4">
          {(["description", "specifications", "shipping"] as const).map((item) => (
            <button
              key={item}
              onClick={() => setTab(item)}
              className={`px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                tab === item ? "border-b-2 border-red-600 text-white" : "text-white/60 hover:text-white"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {tab === "description" && <p className="text-white/75 leading-relaxed">{product.description}</p>}
        {tab === "specifications" && (
          <ul className="space-y-3 text-white/75">
            <li className="flex justify-between"><span className="font-semibold">SKU:</span> <span>{product.sku}</span></li>
            <li className="flex justify-between"><span className="font-semibold">Category:</span> <span>{product.category.name}</span></li>
            <li className="flex justify-between"><span className="font-semibold">Brand:</span> <span>{product.brand.name}</span></li>
            <li className="flex justify-between"><span className="font-semibold">Weight:</span> <span>{product.weight || "N/A"} kg</span></li>
            <li className="flex justify-between"><span className="font-semibold">Available Colors:</span> <span>{uniqueColors.length}</span></li>
          </ul>
        )}
        {tab === "shipping" && (
          <div className="space-y-2 text-white/75">
            <p>Standard delivery in 3-5 business days</p>
            <p>Express next-day available in selected regions</p>
            <p>Free shipping for orders above $200</p>
            <p>Secure packaging guaranteed</p>
          </div>
        )}
      </section>

      {relatedProducts && relatedProducts.length > 0 && (
        <section className="space-y-6">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-red-400">Discover</p>
            <h2 className="font-display text-4xl uppercase tracking-wide">Related Products</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {relatedProducts
              .filter((item) => item.slug !== product.slug)
              .slice(0, 4)
              .map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
          </div>
        </section>
      )}
    </div>
  );
}
