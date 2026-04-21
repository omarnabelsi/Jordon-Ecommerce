"use client";

import Link from "next/link";

import { useAuthStore } from "@/store/auth-store";

type AccountTab = "profile" | "orders" | "addresses" | "wishlist" | "settings";

const navItems: Array<{ href: string; label: string; key: AccountTab }> = [
  { href: "/account", label: "Profile", key: "profile" },
  { href: "/account/orders", label: "Orders", key: "orders" },
  { href: "/account/addresses", label: "Addresses", key: "addresses" },
  { href: "/account/wishlist", label: "Wishlist", key: "wishlist" },
  { href: "/account/settings", label: "Settings", key: "settings" },
];

interface AccountSidebarProps {
  activeTab: AccountTab;
}

export function AccountSidebar({ activeTab }: AccountSidebarProps) {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return null;
  }

  return (
    <aside className="card-surface h-fit space-y-4 p-6">
      <div className="text-center">
        {user.avatar ? (
          <img src={user.avatar} alt={user.email} className="mx-auto h-24 w-24 rounded-full object-cover" />
        ) : (
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-tr from-red-800 to-red-500 text-3xl font-bold text-white">
            {user.first_name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
          </div>
        )}
        <h2 className="mt-4 font-display text-2xl uppercase">
          {user.first_name || ""} {user.last_name || ""}
        </h2>
        <p className="text-sm text-white/60">{user.email}</p>
      </div>

      <hr className="my-4 border-white/10" />

      <nav className="space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className={`block rounded-lg px-4 py-2 text-sm transition ${
              activeTab === item.key
                ? "bg-red-600/20 font-semibold text-white"
                : "text-white/70 hover:bg-white/10"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
