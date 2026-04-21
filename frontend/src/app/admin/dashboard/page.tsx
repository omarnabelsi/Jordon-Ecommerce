"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, BellRing, DollarSign, Package2, ShoppingBag, Users } from "lucide-react";

import { HorizontalBars, TrendLineChart } from "@/components/admin/charts";
import { api } from "@/lib/api";
import { AdminDashboardData } from "@/types/admin";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2
});

function formatLabel(isoDate: string) {
  const value = new Date(isoDate);
  return value.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function AdminDashboardPage() {
  const [days, setDays] = useState(30);

  const dashboardQuery = useQuery({
    queryKey: ["admin-dashboard", days],
    queryFn: async () => {
      const response = await api.get<AdminDashboardData>("/admin/dashboard/", {
        params: { days }
      });
      return response.data;
    }
  });

  const dashboardData = dashboardQuery.data;
  const revenuePoints = useMemo(
    () => dashboardData?.revenue_series.map((point) => point.revenue) ?? [],
    [dashboardData]
  );
  const revenueLabels = useMemo(
    () => dashboardData?.revenue_series.map((point) => formatLabel(point.date)) ?? [],
    [dashboardData]
  );

  if (dashboardQuery.isLoading) {
    return (
      <div className="space-y-5">
        <div className="admin-card animate-pulse p-8">
          <div className="h-5 w-40 rounded bg-slate-700" />
          <div className="mt-3 h-8 w-72 rounded bg-slate-700" />
          <div className="mt-6 h-44 rounded-2xl bg-slate-800" />
        </div>
      </div>
    );
  }

  if (dashboardQuery.isError || !dashboardData) {
    return (
      <div className="admin-card p-8">
        <h1 className="text-2xl font-semibold text-white">Dashboard unavailable</h1>
        <p className="mt-2 text-sm text-slate-300">Unable to load live metrics. Check backend admin endpoints and try again.</p>
      </div>
    );
  }

  const kpis = dashboardData.kpis;

  const cards = [
    {
      label: "Total Revenue",
      value: currencyFormatter.format(kpis.total_revenue),
      helper: `${kpis.revenue_growth >= 0 ? "+" : ""}${kpis.revenue_growth}% vs previous period`,
      icon: DollarSign,
      tone: "from-red-500/35 to-red-800/35"
    },
    {
      label: "Orders",
      value: `${kpis.total_orders}`,
      helper: `${kpis.orders_today} placed today`,
      icon: ShoppingBag,
      tone: "from-red-500/30 to-rose-500/30"
    },
    {
      label: "Customers",
      value: `${kpis.total_customers}`,
      helper: `${kpis.new_customers_30d} new in 30 days`,
      icon: Users,
      tone: "from-red-700/28 to-red-950/40"
    },
    {
      label: "Inventory Alerts",
      value: `${kpis.low_stock_count}`,
      helper: "Variants at or below stock threshold",
      icon: AlertTriangle,
      tone: "from-red-700/30 to-red-900/35"
    }
  ];

  return (
    <div className="space-y-6">
      <header className="admin-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-red-200/70">Operations Pulse</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Admin Dashboard</h1>
            <p className="mt-2 text-sm text-slate-300">Realtime revenue intelligence, order fulfillment metrics, and inventory risk monitoring.</p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/70 p-1">
            {[7, 30, 90].map((value) => (
              <button
                key={value}
                onClick={() => setDays(value)}
                className={`rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                  days === value
                    ? "bg-red-600 text-white"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                {value}D
              </button>
            ))}
          </div>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <article key={card.label} className="admin-card overflow-hidden p-5">
              <div className={`absolute inset-0 bg-gradient-to-br ${card.tone} opacity-45`} />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-300">{card.label}</p>
                  <Icon size={18} className="text-red-200" />
                </div>
                <p className="mt-4 text-3xl font-semibold text-white">{card.value}</p>
                <p className="mt-2 text-xs text-slate-300">{card.helper}</p>
              </div>
            </article>
          );
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <article className="admin-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-200">Revenue Trend</h2>
            <p className="text-xs text-slate-400">Average order value: {currencyFormatter.format(kpis.avg_order_value)}</p>
          </div>
          <TrendLineChart points={revenuePoints} labels={revenueLabels} />
        </article>

        <div className="space-y-4">
          <HorizontalBars
            title="Order Status Split"
            items={dashboardData.status_distribution.map((item) => ({
              label: item.status,
              value: item.count
            }))}
          />
          <div className="admin-card p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Open Support Queue</p>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-3xl font-semibold text-white">{kpis.unread_messages}</p>
              <BellRing className="text-red-300" size={20} />
            </div>
            <p className="mt-2 text-xs text-slate-400">Unread contact messages waiting for follow-up.</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <HorizontalBars
          title="Top Product Revenue (30d)"
          items={dashboardData.top_products.map((item) => ({
            label: item.product_name,
            value: item.revenue
          }))}
          formatter={(value) => currencyFormatter.format(value)}
        />

        <HorizontalBars
          title="Category Performance (30d)"
          items={dashboardData.category_sales.map((item) => ({
            label: item.category,
            value: item.revenue
          }))}
          formatter={(value) => currencyFormatter.format(value)}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <article className="admin-card p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-200">Recent Orders</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] border-separate border-spacing-y-2 text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.2em] text-slate-400">
                  <th className="px-3 py-2">Order</th>
                  <th className="px-3 py-2">Customer</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Payment</th>
                  <th className="px-3 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.recent_orders.map((order) => (
                  <tr key={order.id} className="rounded-xl bg-slate-900/70">
                    <td className="px-3 py-3 font-semibold text-white">{order.order_number}</td>
                    <td className="px-3 py-3 text-slate-300">{order.customer_email}</td>
                    <td className="px-3 py-3 capitalize text-red-200">{order.status}</td>
                    <td className="px-3 py-3 capitalize text-slate-300">{order.payment_status}</td>
                    <td className="px-3 py-3 text-right font-semibold text-white">{currencyFormatter.format(Number(order.grand_total))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="admin-card p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-200">
            <Package2 size={16} className="text-amber-300" /> Low Stock Variants
          </h2>
          <ul className="mt-4 space-y-3">
            {dashboardData.inventory_alerts.length === 0 ? (
              <li className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm text-emerald-200">
                Inventory levels are healthy.
              </li>
            ) : (
              dashboardData.inventory_alerts.map((item) => (
                <li key={item.id} className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">
                  <p className="text-sm font-semibold text-white">{item.product_name}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-amber-100">{item.size} / {item.color_name}</p>
                  <p className="mt-2 text-xs text-slate-300">{item.sku}</p>
                  <p className="mt-1 text-sm font-semibold text-amber-200">{item.stock_quantity} units left</p>
                </li>
              ))
            )}
          </ul>
        </article>
      </section>
    </div>
  );
}
