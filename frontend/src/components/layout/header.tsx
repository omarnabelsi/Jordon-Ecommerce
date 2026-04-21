"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronDown, LogOut, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { useCartStore } from "@/store/cart-store";
import { useAuthStore } from "@/store/auth-store";
import { api } from "@/lib/api";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Shop" },
  { href: "/products?category=men", label: "Men", category: "men" },
  { href: "/products?category=women", label: "Women", category: "women" },
  { href: "/products?category=shoes", label: "Shoes", category: "shoes" },
  { href: "/contact", label: "Contact" }
];

function isActiveItem(pathname: string, activeCategory: string | null, href: string, category?: string) {
  if (href === "/") {
    return pathname === "/";
  }

  if (href === "/products") {
    return pathname === "/products" && !activeCategory;
  }

  if (category) {
    return pathname === "/products" && activeCategory === category;
  }

  return pathname.startsWith(href);
}

export function Navbar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const totalItems = useCartStore((state) => state.totalItems());
  const { user, setUser } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const activeCategory = searchParams.get("category");

  const userInitials = useMemo(() => {
    if (!user) return "";

    const first = user.first_name?.trim()[0];
    const last = user.last_name?.trim()[0];
    if (first || last) {
      return `${first || ""}${last || ""}`.toUpperCase();
    }

    return user.email.slice(0, 2).toUpperCase();
  }, [user]);

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        const response = await api.get("/auth/me/", {
          // Treat anonymous/rate-limited responses as valid states to avoid noisy errors.
          validateStatus: (status) => status === 200 || status === 401 || status === 429
        });

        if (!isMounted) return;

        if (response.status === 200) {
          setUser(response.data);
        } else if (response.status === 401) {
          setUser(null);
        }
      } catch {
        // Preserve last known user on transient network/rate-limit failures.
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [setUser]);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 12);
    onScroll();

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (menuRef.current.contains(event.target as Node)) return;

      setShowUserMenu(false);
      setMobileOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setShowUserMenu(false);
  }, [pathname, activeCategory]);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout/");
      setUser(null);
      setShowUserMenu(false);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-all duration-300 ${
        isScrolled
          ? "border-white/15 bg-black/75 shadow-[0_18px_45px_rgba(0,0,0,0.45)] backdrop-blur-2xl"
          : "border-white/10 bg-black/45 backdrop-blur-xl"
      }`}
    >
      <div className="container-shell" ref={menuRef}>
        <div className="flex h-20 items-center justify-between gap-4">
          <Link href="/" className="group flex items-center gap-3 text-white transition hover:opacity-90">
            <Image
              src="/logo-jordan.svg"
              alt="Jordan logo"
              width={42}
              height={42}
              className="h-10 w-10 rounded-full shadow-[0_0_22px_rgba(220,38,38,0.38)]"
              priority
            />
            <div>
              <p className="font-display text-3xl tracking-wider leading-none">JORDAN</p>
              <p className="text-[10px] uppercase tracking-[0.42em] text-white/55 group-hover:text-white/75">Performance Society</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const isActive = isActiveItem(pathname, activeCategory, item.href, item.category);

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`relative rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] transition ${
                    isActive ? "text-white" : "text-white/70 hover:text-white"
                  }`}
                >
                  {item.label}
                  <span
                    className={`absolute inset-x-3 bottom-0 h-[2px] rounded-full bg-gradient-to-r from-red-500 to-red-700 transition-opacity ${
                      isActive ? "opacity-100" : "opacity-0"
                    }`}
                  />
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/products"
              className="focus-ring hidden rounded-full border border-white/20 p-2.5 text-white/90 transition hover:border-white/40 hover:text-white md:inline-flex"
              aria-label="Search products"
            >
              <Search size={17} />
            </Link>

            <Link
              href="/cart"
              className="focus-ring relative rounded-full border border-white/20 p-2.5 text-white/90 transition hover:border-white/40 hover:text-white"
              aria-label="Open cart"
            >
              <ShoppingBag size={17} />
              {totalItems > 0 ? (
                <span className="absolute -right-2 -top-2 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white shadow-[0_0_12px_rgba(239,68,68,0.8)]">
                  {totalItems}
                </span>
              ) : null}
            </Link>

            {!isLoading && !user ? (
              <div className="hidden items-center gap-2 md:flex">
                <Link
                  href="/login"
                  className="focus-ring rounded-full border border-white/25 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/85 transition hover:border-white/55 hover:text-white"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="btn-primary focus-ring rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em]"
                >
                  Sign Up
                </Link>
              </div>
            ) : null}

            {!isLoading && user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowUserMenu((prev) => !prev)}
                  className="focus-ring flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.03] px-2 py-1.5 text-white transition hover:border-white/45"
                  aria-expanded={showUserMenu}
                  aria-label="Toggle user menu"
                >
                  <span className="relative inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-red-400/30 bg-gradient-to-br from-red-600/50 to-red-900/70 text-xs font-bold text-white">
                    {user.avatar ? (
                      // Use native img to avoid Next.js domain restrictions for user-uploaded avatars.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={user.avatar} alt={user.email} className="h-full w-full object-cover" />
                    ) : (
                      userInitials
                    )}
                  </span>
                  <ChevronDown size={14} className={`transition ${showUserMenu ? "rotate-180" : "rotate-0"}`} />
                </button>

                {showUserMenu ? (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-white/15 bg-black/95 p-2 shadow-2xl backdrop-blur-2xl">
                    <p className="px-3 py-2 text-xs uppercase tracking-[0.2em] text-white/45">Signed in as</p>
                    <p className="px-3 pb-3 text-sm font-semibold text-white">{user.email}</p>
                    <div className="space-y-1 border-t border-white/10 pt-2">
                      <Link href="/account" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/80 transition hover:bg-white/10 hover:text-white">
                        <User size={15} /> Account
                      </Link>
                      <Link href="/orders" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/80 transition hover:bg-white/10 hover:text-white">
                        <ShoppingBag size={15} /> Orders
                      </Link>
                      <Link href="/wishlist" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/80 transition hover:bg-white/10 hover:text-white">
                        <User size={15} /> Wishlist
                      </Link>
                      {user.is_staff ? (
                        <Link href="/admin/dashboard" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-300 transition hover:bg-red-500/10">
                          <User size={15} /> Admin Panel
                        </Link>
                      ) : null}
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-300 transition hover:bg-red-500/10"
                      >
                        <LogOut size={15} /> Logout
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              className="focus-ring inline-flex rounded-full border border-white/20 p-2.5 text-white transition hover:border-white/45 md:hidden"
              aria-expanded={mobileOpen}
              aria-label="Toggle mobile navigation"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {mobileOpen ? (
          <div className="mb-4 rounded-2xl border border-white/15 bg-black/90 p-3 shadow-2xl backdrop-blur-2xl md:hidden">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = isActiveItem(pathname, activeCategory, item.href, item.category);

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`block rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                      isActive ? "bg-red-600/20 text-white" : "text-white/80 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {!isLoading && !user ? (
              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/10 pt-3">
                <Link href="/login" className="rounded-xl border border-white/20 px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.2em] text-white/85">
                  Login
                </Link>
                <Link href="/register" className="rounded-xl bg-red-600 px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.2em] text-white">
                  Sign Up
                </Link>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </header>
  );
}

export function Header() {
  return <Navbar />;
}
