"use client";

import { ReactNode, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3, Boxes, Download, LogOut, PackageSearch, ShieldCheck,
  ShoppingCart, Users, Search, X, Moon, Sun
} from "lucide-react";

import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";

interface AdminShellProps {
  children: ReactNode;
}

const navItems = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: BarChart3,
    description: "Realtime KPIs"
  },
  {
    label: "Products",
    href: "/admin/products",
    icon: Boxes,
    description: "Catalog + stock"
  },
  {
    label: "Orders",
    href: "/admin/orders",
    icon: ShoppingCart,
    description: "Fulfillment desk"
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: Users,
    description: "Accounts + roles"
  }
];

interface SearchResult {
  type: "order" | "product" | "user";
  label: string;
  sub: string;
  href: string;
}

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearUser } = useAuthStore();
  const [darkMode, setDarkMode] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.remove("admin-light");
    } else {
      document.documentElement.classList.add("admin-light");
    }
  }, [darkMode]);

  // Close search on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Global search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      const results: SearchResult[] = [];
      const q = searchQuery.toLowerCase();

      try {
        // Search orders
        const ordersRes = await api.get("/admin/orders/", { params: { search: q } });
        const orders = ordersRes.data?.results || ordersRes.data || [];
        (Array.isArray(orders) ? orders : []).slice(0, 3).forEach((o: { order_number: string; customer_email: string; id: number }) => {
          results.push({
            type: "order",
            label: o.order_number,
            sub: o.customer_email,
            href: `/admin/orders?search=${q}`
          });
        });
      } catch { /* ignore */ }

      try {
        // Search products
        const productsRes = await api.get("/admin/products/", { params: { search: q } });
        const products = productsRes.data?.results || productsRes.data || [];
        (Array.isArray(products) ? products : []).slice(0, 3).forEach((p: { name: string; sku: string; id: number }) => {
          results.push({
            type: "product",
            label: p.name,
            sub: p.sku,
            href: `/admin/products?search=${q}`
          });
        });
      } catch { /* ignore */ }

      try {
        // Search users
        const usersRes = await api.get("/admin/users/", { params: { search: q } });
        const users = usersRes.data?.results || usersRes.data || [];
        (Array.isArray(users) ? users : []).slice(0, 3).forEach((u: { email: string; first_name: string; last_name: string; id: number }) => {
          results.push({
            type: "user",
            label: u.email,
            sub: `${u.first_name} ${u.last_name}`.trim(),
            href: `/admin/users?search=${q}`
          });
        });
      } catch { /* ignore */ }

      setSearchResults(results);
      setSearching(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout/");
    } catch {
      // Ignore logout network errors and clear local auth state.
    } finally {
      clearUser();
      router.replace("/");
    }
  };

  const roleLabel = user?.is_superuser ? "Admin" : user?.is_staff ? "Staff" : "User";

  return (
    <section className={`admin-page-bg min-h-screen ${!darkMode ? "admin-light-mode" : ""}`}>
      <div className="admin-grid">
        <aside className="admin-sidebar">
          <div className="admin-sidebar-brand">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/20 text-red-300 ring-1 ring-red-400/30">
              <ShieldCheck size={22} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-red-200/70">Control Center</p>
              <h1 className="text-xl font-semibold text-white">Jumpman Ops</h1>
            </div>
          </div>

          <nav className="mt-8 space-y-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`admin-nav-item ${isActive ? "is-active" : ""}`}
                >
                  <Icon size={18} />
                  <span>
                    <strong>{item.label}</strong>
                    <small>{item.description}</small>
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-8 rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-red-200/80">Shortcuts</p>
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/admin/orders/export/`}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-300/25 bg-red-300/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-red-100 transition hover:bg-red-300/20"
            >
              <Download size={14} /> Export Orders CSV
            </a>
            <Link
              href="/products"
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-500/30 bg-slate-600/20 px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-100 transition hover:bg-slate-500/30"
            >
              <PackageSearch size={14} /> Open Storefront
            </Link>
          </div>

          <button
            onClick={handleLogout}
            className="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-xl border border-rose-300/30 bg-rose-500/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-rose-100 transition hover:bg-rose-500/20"
          >
            <LogOut size={15} /> Logout
          </button>
        </aside>

        <div className="admin-main">
          <header className="admin-topbar">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Signed in as</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-100">{user?.email || "admin"}</p>
                  <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-200">
                    {roleLabel}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Global Search */}
              <div ref={searchRef} className="relative">
                <button
                  onClick={() => setSearchOpen(!searchOpen)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 bg-slate-900/70 text-slate-300 transition hover:text-white"
                >
                  <Search size={16} />
                </button>

                {searchOpen ? (
                  <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-slate-700 bg-slate-900 p-3 shadow-2xl">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        autoFocus
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search orders, products, users..."
                        className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950 pl-8 pr-8 text-xs text-white placeholder:text-slate-500 focus:border-red-500/50 focus:outline-none"
                      />
                      {searchQuery ? (
                        <button
                          onClick={() => { setSearchQuery(""); setSearchResults([]); }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                        >
                          <X size={14} />
                        </button>
                      ) : null}
                    </div>

                    {searching ? (
                      <p className="mt-3 text-center text-xs text-slate-500">Searching...</p>
                    ) : searchResults.length > 0 ? (
                      <div className="mt-2 max-h-60 space-y-1 overflow-y-auto">
                        {searchResults.map((r, i) => (
                          <Link
                            key={`${r.type}-${i}`}
                            href={r.href}
                            onClick={() => setSearchOpen(false)}
                            className="flex items-center gap-3 rounded-lg px-2 py-2 text-xs transition hover:bg-slate-800"
                          >
                            <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold uppercase text-slate-400">
                              {r.type}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-semibold text-white">{r.label}</p>
                              <p className="truncate text-slate-500">{r.sub}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : searchQuery ? (
                      <p className="mt-3 text-center text-xs text-slate-500">No results found</p>
                    ) : null}
                  </div>
                ) : null}
              </div>

              {/* Dark/Light Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 bg-slate-900/70 text-slate-300 transition hover:text-white"
                title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              >
                {darkMode ? <Sun size={16} /> : <Moon size={16} />}
              </button>

              <div className="rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-right">
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Environment</p>
                <p className="text-sm font-semibold text-red-200">Production-like Local</p>
              </div>
            </div>
          </header>
          <div className="admin-content">{children}</div>
        </div>
      </div>
    </section>
  );
}
