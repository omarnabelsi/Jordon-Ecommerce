"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useCart } from "@/hooks/use-cart";
import { useFeaturedProducts, useProductDetail } from "@/hooks/use-products";
import { Product } from "@/types";

const AUTOPLAY_MS = 4500;

const heroNarratives = [
  {
    badge: "Best Seller",
    urgency: "Only 10 left",
    headline: "The Court Icon Is Back",
    subtitle: "Explosive comfort tuned for game-day confidence."
  },
  {
    badge: "Limited Drop",
    urgency: "Ends today",
    headline: "Built For Speed. Styled For Streets.",
    subtitle: "Responsive foam and modern traction for all-day momentum."
  },
  {
    badge: "Members Exclusive",
    urgency: "Selling fast",
    headline: "Elevate Every Step In Rotation",
    subtitle: "Premium cushioning with a silhouette made to stand out."
  },
  {
    badge: "Fresh Arrival",
    urgency: "Low stock alert",
    headline: "Next-Level Grip. Zero Compromise.",
    subtitle: "Designed to move from street to court without slowing down."
  }
];

const fallbackSlides = [
  {
    id: "fallback-1",
    slug: "air-jordan-1-retro-high",
    name: "Air Jordan 1 Retro High",
    badge: "Best Seller",
    urgency: "Only 10 left",
    headline: "The Court Icon Is Back",
    subtitle: "Explosive comfort tuned for game-day confidence.",
    price: 189,
    compareAt: 239,
    image:
      "https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=1400&q=80"
  },
  {
    id: "fallback-2",
    slug: "jordan-jumpman-2021-pf",
    name: "Jordan Jumpman 2021 PF",
    badge: "Limited Drop",
    urgency: "Ends today",
    headline: "Built For Speed. Styled For Streets.",
    subtitle: "Responsive foam and modern traction for all-day momentum.",
    price: 134,
    compareAt: 172,
    image:
      "https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?auto=format&fit=crop&w=1400&q=80"
  },
  {
    id: "fallback-3",
    slug: "nike-air-velocity",
    name: "Nike Air Velocity",
    badge: "Members Exclusive",
    urgency: "Selling fast",
    headline: "Elevate Every Step In Rotation",
    subtitle: "Premium cushioning with a silhouette made to stand out.",
    price: 139,
    compareAt: 159,
    image:
      "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=1400&q=80"
  }
];

const copyContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12 } },
  exit: { opacity: 0, transition: { duration: 0.2 } }
};

const copyItem = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.2 } }
};

interface HeroSlide {
  id: string;
  slug: string;
  name: string;
  badge: string;
  urgency: string;
  headline: string;
  subtitle: string;
  image: string;
  price: number;
  compareAt: number | null;
}

function toAmount(value: string | number | null | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function buildSlides(products?: Product[]): HeroSlide[] {
  if (!products?.length) {
    return fallbackSlides;
  }

  return products.slice(0, 4).map((product, index) => {
    const narrative = heroNarratives[index % heroNarratives.length];
    const currentPrice = toAmount(product.current_price || product.price);
    const compareAtPrice = product.sale_price ? toAmount(product.price) : Math.round(currentPrice * 1.16 * 100) / 100;

    return {
      id: `${product.id}`,
      slug: product.slug,
      name: product.name,
      badge: narrative.badge,
      urgency: narrative.urgency,
      headline: narrative.headline,
      subtitle: product.short_description || narrative.subtitle,
      image:
        product.images?.[0]?.image ||
        product.primary_image ||
        fallbackSlides[index % fallbackSlides.length].image,
      price: currentPrice,
      compareAt: compareAtPrice > currentPrice ? compareAtPrice : null
    };
  });
}

export function HeroSlider() {
  const router = useRouter();
  const { addToCart } = useCart();
  const { data: featuredProducts } = useFeaturedProducts();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const slides = useMemo(() => buildSlides(featuredProducts), [featuredProducts]);

  useEffect(() => {
    if (activeIndex < slides.length) return;
    setActiveIndex(0);
  }, [activeIndex, slides.length]);

  useEffect(() => {
    if (isHovering || slides.length < 2) return;

    // Autoplay pauses while users hover, so manual interactions never feel interrupted.
    const intervalId = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, AUTOPLAY_MS);

    return () => window.clearInterval(intervalId);
  }, [isHovering, slides.length]);

  const activeSlide = slides[activeIndex] || fallbackSlides[0];
  const { data: activeProduct } = useProductDetail(activeSlide.slug);

  const selectedVariant = useMemo(() => {
    if (!activeProduct?.variants?.length) return null;
    return activeProduct.variants.find((variant) => variant.is_in_stock) || activeProduct.variants[0];
  }, [activeProduct?.variants]);

  const activeName = activeProduct?.name || activeSlide.name;
  const activeImage =
    activeProduct?.images?.[0]?.image ||
    activeProduct?.primary_image ||
    activeSlide.image;

  const activePrice = activeProduct ? toAmount(activeProduct.current_price || activeProduct.price) : activeSlide.price;
  const activeCompareAt =
    activeProduct?.sale_price
      ? toAmount(activeProduct.price)
      : activeSlide.compareAt;

  const discountPercent = useMemo(() => {
    if (!activeCompareAt || activeCompareAt <= activePrice) return null;
    return Math.round(((activeCompareAt - activePrice) / activeCompareAt) * 100);
  }, [activeCompareAt, activePrice]);

  const goToSlide = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  const nextSlide = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const previousSlide = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const getErrorMessage = (error: unknown, fallback: string) => {
    if (!error || typeof error !== "object") return fallback;
    const maybeResponse = (error as { response?: { data?: { detail?: string } } }).response;
    return maybeResponse?.data?.detail || fallback;
  };

  const handleAddToCart = async () => {
    if (!selectedVariant || !selectedVariant.is_in_stock) {
      setActionMessage({ type: "error", text: "This drop is currently out of stock." });
      return;
    }

    setActionMessage(null);

    try {
      await addToCart.mutateAsync({ product_variant_id: selectedVariant.id, quantity: 1 });
      setActionMessage({ type: "success", text: "Added to cart. Ready when you are." });
    } catch (error) {
      setActionMessage({ type: "error", text: getErrorMessage(error, "Could not add to cart right now.") });
    }
  };

  const handleBuyNow = async () => {
    if (!selectedVariant || !selectedVariant.is_in_stock) {
      setActionMessage({ type: "error", text: "This drop is currently out of stock." });
      return;
    }

    setActionMessage(null);

    try {
      await addToCart.mutateAsync({ product_variant_id: selectedVariant.id, quantity: 1 });
      router.push("/checkout");
    } catch (error) {
      setActionMessage({ type: "error", text: getErrorMessage(error, "Could not continue to checkout.") });
    }
  };

  return (
    <section className="relative isolate overflow-hidden pb-14 pt-8 lg:pb-24 lg:pt-12">
      <div className="hero-gradient-motion pointer-events-none absolute inset-0 -z-20" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_10%_30%,rgba(220,38,38,0.26),transparent_45%),radial-gradient(circle_at_88%_20%,rgba(153,27,27,0.22),transparent_42%)]" />

      <div className="container-shell">
        <div
          className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-black/55 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.6)] sm:p-8 lg:p-10"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.0)_50%,rgba(255,255,255,0.03)_100%)]" />

          <div className="relative grid items-center gap-10 lg:grid-cols-[1.08fr_1fr]">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeSlide.id}-copy`}
                variants={copyContainer}
                initial="hidden"
                animate="show"
                exit="exit"
                className="space-y-5"
              >
                <motion.div variants={copyItem} className="flex flex-wrap items-center gap-3">
                  <span className="red-pill">{activeSlide.badge}</span>
                  <span className="rounded-full border border-red-400/35 bg-red-600/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-red-200">
                    {activeSlide.urgency}
                  </span>
                </motion.div>

                <motion.h1 variants={copyItem} className="font-display text-5xl uppercase leading-[0.95] text-white sm:text-6xl lg:text-7xl">
                  {activeSlide.headline}
                </motion.h1>

                <motion.p variants={copyItem} className="max-w-xl text-sm leading-relaxed text-white/70 lg:text-base">
                  {activeSlide.subtitle}
                </motion.p>

                <motion.div variants={copyItem} className="flex flex-wrap items-end gap-3">
                  <p className="text-4xl font-black text-red-500 sm:text-5xl">${activePrice.toFixed(2)}</p>
                  {activeCompareAt ? (
                    <p className="pb-1 text-lg text-white/40 line-through">${activeCompareAt.toFixed(2)}</p>
                  ) : null}
                  {discountPercent ? (
                    <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
                      Save {discountPercent}%
                    </span>
                  ) : null}
                </motion.div>

                <motion.div variants={copyItem} className="flex flex-wrap gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleBuyNow}
                    disabled={addToCart.isPending}
                    className="btn-primary focus-ring rounded-full px-8 py-3 text-xs font-extrabold uppercase tracking-[0.24em] text-white disabled:opacity-60"
                  >
                    {addToCart.isPending ? "Processing..." : "Buy Now"}
                  </button>
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={addToCart.isPending}
                    className="btn-secondary focus-ring rounded-full px-8 py-3 text-xs font-bold uppercase tracking-[0.24em] text-white disabled:opacity-60"
                  >
                    Add to Cart
                  </button>
                </motion.div>

                <motion.p variants={copyItem} className="text-xs uppercase tracking-[0.24em] text-white/55">
                  {activeName}
                </motion.p>

                {actionMessage ? (
                  <motion.p variants={copyItem} className={`text-sm ${actionMessage.type === "success" ? "text-emerald-300" : "text-red-300"}`}>
                    {actionMessage.text}
                  </motion.p>
                ) : null}
              </motion.div>
            </AnimatePresence>

            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeSlide.id}-image`}
                initial={{ opacity: 0, x: 22, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -18, scale: 0.98 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="relative mx-auto h-[280px] w-full max-w-[620px] sm:h-[350px] lg:h-[420px]"
              >
                <div className="absolute inset-x-[16%] bottom-8 h-9 rounded-full bg-red-900/45 blur-2xl" />
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 5.8, ease: "easeInOut", repeat: Number.POSITIVE_INFINITY }}
                  className="relative h-full w-full"
                >
                  <Image
                    src={activeImage}
                    alt={activeName}
                    fill
                    priority={activeIndex === 0}
                    sizes="(max-width: 1024px) 100vw, 48vw"
                    className="object-contain drop-shadow-[0_35px_35px_rgba(0,0,0,0.75)]"
                  />
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>

          <button
            type="button"
            onClick={previousSlide}
            className="focus-ring absolute left-4 top-1/2 hidden -translate-y-1/2 rounded-full border border-white/25 bg-black/55 p-2 text-white transition hover:border-white/50 hover:bg-black/75 sm:inline-flex"
            aria-label="Previous slide"
          >
            <ArrowLeft size={17} />
          </button>
          <button
            type="button"
            onClick={nextSlide}
            className="focus-ring absolute right-4 top-1/2 hidden -translate-y-1/2 rounded-full border border-white/25 bg-black/55 p-2 text-white transition hover:border-white/50 hover:bg-black/75 sm:inline-flex"
            aria-label="Next slide"
          >
            <ArrowRight size={17} />
          </button>

          <div className="mt-8 flex items-center justify-center gap-2">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => goToSlide(index)}
                className={`h-2.5 rounded-full transition-all ${index === activeIndex ? "w-8 bg-red-500" : "w-2.5 bg-white/35 hover:bg-white/55"}`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function HeroSection() {
  return <HeroSlider />;
}
