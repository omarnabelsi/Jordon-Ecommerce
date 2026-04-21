"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, Boxes, Download, LogOut, PackageSearch, ShieldCheck, ShoppingCart, Users } from "lucide-react";

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

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearUser } = useAuthStore();

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

  return (
    <section className="admin-page-bg min-h-screen">
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
              const isActive = pathname === item.href;

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
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Signed in as</p>
              <p className="text-sm font-semibold text-slate-100">{user?.email || "admin"}</p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-right">
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Environment</p>
              <p className="text-sm font-semibold text-red-200">Production-like Local</p>
            </div>
          </header>
          <div className="admin-content">{children}</div>
        </div>
      </div>
    </section>
  );
}
