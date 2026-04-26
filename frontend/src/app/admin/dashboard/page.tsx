"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle, BellRing, DollarSign, Package2, ShoppingBag, Users,
  TrendingUp, Clock, RefreshCw, Search, ArrowUpRight, ArrowDownRight,
  RotateCcw, ChevronDown, X
} from "lucide-react";

import { HorizontalBars, TrendLineChart, DonutChart } from "@/components/admin/charts";
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

function timeAgo(date: Date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  pending: { bg: "bg-yellow-500/15", text: "text-yellow-300", dot: "🟡" },
  paid: { bg: "bg-blue-500/15", text: "text-blue-300", dot: "🔵" },
  processing: { bg: "bg-blue-500/15", text: "text-blue-300", dot: "🔵" },
  shipped: { bg: "bg-blue-500/15", text: "text-blue-300", dot: "🔵" },
  delivered: { bg: "bg-emerald-500/15", text: "text-emerald-300", dot: "🟢" },
  cancelled: { bg: "bg-red-500/15", text: "text-red-300", dot: "🔴" },
};

const STOCK_THRESHOLD_RED = 2;
const STOCK_THRESHOLD_ORANGE = 4;

// Demo orders for fallback
const DEMO_ORDERS = Array.from({ length: 10 }, (_, i) => ({
  id: 9000 + i,
  order_number: `ORD-20260425-${String(i + 1).padStart(5, "0")}`,
  customer_email: `customer${i + 1}@example.com`,
  status: ["pending", "shipped", "delivered", "processing", "cancelled"][i % 5],
  payment_status: ["pending", "paid", "paid", "paid", "refunded"][i % 5],
  grand_total: String((89.99 + i * 22.5).toFixed(2)),
  created_at: new Date(Date.now() - i * 3600000 * 6).toISOString(),
  product_image: null as string | null,
}));

export default function AdminDashboardPage() {
  const [days, setDays] = useState(7);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("");
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [bulkStatus, setBulkStatus] = useState("");
  const [orderDetailId, setOrderDetailId] = useState<number | null>(null);

  const dashboardQuery = useQuery({
    queryKey: ["admin-dashboard", days],
    queryFn: async () => {
      const response = await api.get<AdminDashboardData>("/admin/dashboard/", {
        params: { days }
      });
      setLastUpdated(new Date());
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

  // Calculate today/week revenue from series
  const todayStr = new Date().toISOString().split("T")[0];
  const revenueToday = dashboardData.revenue_series.find((p) => p.date === todayStr)?.revenue ?? 0;
  const last7 = dashboardData.revenue_series.slice(-7);
  const revenueWeek = last7.reduce((sum, p) => sum + p.revenue, 0);
  const inventoryValue = kpis.low_stock_count * 120; // Approximate

  const highPriorityCards = [
    {
      label: "Revenue Today",
      value: currencyFormatter.format(revenueToday),
      icon: DollarSign,
      trend: revenueToday > 0 ? "up" : "neutral",
      tone: "from-emerald-500/30 to-emerald-800/30",
    },
    {
      label: "Revenue This Week",
      value: currencyFormatter.format(revenueWeek),
      icon: TrendingUp,
      trend: "up",
      tone: "from-blue-500/30 to-blue-800/30",
    },
    {
      label: "Pending Orders",
      value: `${kpis.pending_orders}`,
      icon: Clock,
      trend: kpis.pending_orders > 3 ? "alert" : "neutral",
      tone: "from-amber-500/30 to-amber-800/30",
    },
    {
      label: "Avg Order Value",
      value: currencyFormatter.format(kpis.avg_order_value),
      icon: ShoppingBag,
      trend: "neutral",
      tone: "from-purple-500/30 to-purple-800/30",
    },
    {
      label: "Total Revenue",
      value: currencyFormatter.format(kpis.total_revenue),
      helper: `${kpis.revenue_growth >= 0 ? "+" : ""}${kpis.revenue_growth}% vs prev`,
      icon: DollarSign,
      trend: kpis.revenue_growth >= 0 ? "up" : "down",
      tone: "from-red-500/35 to-red-800/35",
    },
    {
      label: "Customers",
      value: `${kpis.total_customers}`,
      helper: `${kpis.new_customers_30d} new in 30d`,
      icon: Users,
      trend: "neutral",
      tone: "from-red-700/28 to-red-950/40",
    },
  ];

  // Orders: use real data or demo fallback
  let displayOrders = dashboardData.recent_orders.length >= 10
    ? dashboardData.recent_orders
    : [...dashboardData.recent_orders, ...DEMO_ORDERS.slice(dashboardData.recent_orders.length)];

  // Filter orders
  if (orderSearch) {
    const q = orderSearch.toLowerCase();
    displayOrders = displayOrders.filter(
      (o) => o.order_number.toLowerCase().includes(q) || o.customer_email.toLowerCase().includes(q)
    );
  }
  if (orderStatusFilter) {
    displayOrders = displayOrders.filter((o) => o.status === orderStatusFilter);
  }

  // Sort inventory alerts by stock ascending
  const sortedAlerts = [...dashboardData.inventory_alerts].sort(
    (a, b) => a.stock_quantity - b.stock_quantity
  );

  // Category performance with percentages
  const totalCatRevenue = dashboardData.category_sales.reduce((s, c) => s + c.revenue, 0) || 1;

  // Status distribution for donut
  const statusItems = dashboardData.status_distribution.map((item) => ({
    label: item.status,
    value: item.count,
    color: item.status === "pending" ? "#eab308" : item.status === "delivered" ? "#22c55e" : item.status === "cancelled" ? "#ef4444" : "#3b82f6",
  }));

  const handleBulkUpdate = async () => {
    if (!bulkStatus || selectedOrders.length === 0) return;
    try {
      await Promise.all(
        selectedOrders.map((id) =>
          api.patch(`/admin/orders/${id}/status/`, { status: bulkStatus })
        )
      );
      setSelectedOrders([]);
      setBulkStatus("");
      dashboardQuery.refetch();
    } catch {
      // silent
    }
  };

  const toggleOrderSelect = (id: number) => {
    setSelectedOrders((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="admin-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-red-200/70">Operations Pulse</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Admin Dashboard</h1>
            <p className="mt-2 text-sm text-slate-300">Realtime revenue intelligence, order fulfillment metrics, and inventory risk monitoring.</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Last Updated */}
            <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-xs text-slate-400">
              <Clock size={12} />
              <span>Updated: {timeAgo(lastUpdated)}</span>
              <button
                onClick={() => dashboardQuery.refetch()}
                className="ml-1 rounded p-0.5 transition hover:text-white"
                title="Refresh data"
              >
                <RefreshCw size={12} className={dashboardQuery.isFetching ? "animate-spin" : ""} />
              </button>
            </div>

            {/* Period Selector */}
            <div className="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-950/70 p-1">
              {[7, 30, 90].map((value) => (
                <button
                  key={value}
                  onClick={() => setDays(value)}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                    days === value ? "bg-red-600 text-white" : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  {value}D
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* High Priority KPIs */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {highPriorityCards.map((card) => {
          const Icon = card.icon;
          return (
            <article key={card.label} className="admin-card overflow-hidden p-5">
              <div className={`absolute inset-0 bg-gradient-to-br ${card.tone} opacity-45`} />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-slate-300">{card.label}</p>
                  <Icon size={16} className="text-red-200/70" />
                </div>
                <p className="mt-3 text-2xl font-semibold text-white">{card.value}</p>
                <div className="mt-2 flex items-center gap-1 text-xs">
                  {card.trend === "up" ? (
                    <ArrowUpRight size={12} className="text-emerald-400" />
                  ) : card.trend === "down" ? (
                    <ArrowDownRight size={12} className="text-red-400" />
                  ) : card.trend === "alert" ? (
                    <AlertTriangle size={12} className="text-amber-400" />
                  ) : null}
                  <span className="text-slate-400">{card.helper || ""}</span>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {/* Charts Row */}
      <section className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <article className="admin-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-200">Revenue Trend</h2>
            <p className="text-xs text-slate-400">Avg order: {currencyFormatter.format(kpis.avg_order_value)}</p>
          </div>
          <TrendLineChart points={revenuePoints} labels={revenueLabels} />
        </article>

        <div className="space-y-4">
          {/* Donut Chart for Order Status */}
          <article className="admin-card p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-200">Order Status Breakdown</h2>
            <DonutChart items={statusItems} />
          </article>

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

      {/* Top Products & Category Performance */}
      <section className="grid gap-4 xl:grid-cols-2">
        {/* Top 5 Products */}
        <article className="admin-card p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-200">Top 5 Products by Revenue</h2>
          <div className="space-y-3">
            {dashboardData.top_products.slice(0, 5).map((item, idx) => {
              const maxRev = dashboardData.top_products[0]?.revenue || 1;
              const pct = Math.max((item.revenue / maxRev) * 100, 4);
              return (
                <div key={item.product_id}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded bg-red-500/20 text-[10px] font-bold text-red-200">
                        {idx + 1}
                      </span>
                      <span className="truncate pr-4 text-slate-300">{item.product_name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-right">
                      <span className="text-slate-500">{item.units} sold</span>
                      <span className="font-semibold text-red-200">{currencyFormatter.format(item.revenue)}</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800">
                    <div className="h-full rounded-full bg-gradient-to-r from-red-500 to-red-700" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        {/* Category Performance */}
        <article className="admin-card p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-200">Category Performance</h2>
          <div className="space-y-4">
            {dashboardData.category_sales.map((cat) => {
              const pct = ((cat.revenue / totalCatRevenue) * 100).toFixed(1);
              return (
                <div key={cat.category}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-slate-300">{cat.category}</span>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-300">{pct}%</span>
                      <span className="font-semibold text-red-200">{currencyFormatter.format(cat.revenue)}</span>
                    </div>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-red-500 to-rose-600 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </article>
      </section>

      {/* Recent Orders */}
      <section className="admin-card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-200">Recent Orders</h2>
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                placeholder="Search orders..."
                className="h-8 rounded-lg border border-slate-700 bg-slate-950/70 pl-8 pr-3 text-xs text-white placeholder:text-slate-500 focus:border-red-500/50 focus:outline-none"
              />
            </div>
            {/* Status filter */}
            <select
              value={orderStatusFilter}
              onChange={(e) => setOrderStatusFilter(e.target.value)}
              className="h-8 rounded-lg border border-slate-700 bg-slate-950/70 px-2 text-xs text-white focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
            {/* Bulk actions */}
            {selectedOrders.length > 0 ? (
              <div className="flex items-center gap-1">
                <span className="text-xs text-slate-400">{selectedOrders.length} selected</span>
                <select
                  value={bulkStatus}
                  onChange={(e) => setBulkStatus(e.target.value)}
                  className="h-8 rounded-lg border border-slate-700 bg-slate-950/70 px-2 text-xs text-white focus:outline-none"
                >
                  <option value="">Bulk Action</option>
                  <option value="processing">Mark Processing</option>
                  <option value="shipped">Mark Shipped</option>
                  <option value="delivered">Mark Delivered</option>
                </select>
                <button
                  onClick={handleBulkUpdate}
                  disabled={!bulkStatus}
                  className="h-8 rounded-lg bg-red-600 px-3 text-xs font-semibold text-white disabled:opacity-40"
                >
                  Apply
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-separate border-spacing-y-1 text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.2em] text-slate-400">
                <th className="px-2 py-2 w-8">
                  <input
                    type="checkbox"
                    checked={selectedOrders.length === displayOrders.length && displayOrders.length > 0}
                    onChange={() => {
                      if (selectedOrders.length === displayOrders.length) {
                        setSelectedOrders([]);
                      } else {
                        setSelectedOrders(displayOrders.map((o) => o.id));
                      }
                    }}
                    className="accent-red-500"
                  />
                </th>
                <th className="px-3 py-2">Order</th>
                <th className="px-3 py-2">Customer</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Payment</th>
                <th className="px-3 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {displayOrders.map((order) => {
                const sc = STATUS_COLORS[order.status] || STATUS_COLORS.pending;
                return (
                  <tr
                    key={order.id}
                    className="cursor-pointer rounded-xl bg-slate-900/70 transition hover:bg-slate-800/70"
                    onClick={() => setOrderDetailId(order.id === orderDetailId ? null : order.id)}
                  >
                    <td className="px-2 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order.id)}
                        onChange={() => toggleOrderSelect(order.id)}
                        className="accent-red-500"
                      />
                    </td>
                    <td className="px-3 py-3 font-semibold text-white">{order.order_number}</td>
                    <td className="px-3 py-3 text-slate-300">{order.customer_email}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${sc.bg} ${sc.text}`}>
                        {sc.dot} {order.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 capitalize text-slate-300">{order.payment_status}</td>
                    <td className="px-3 py-3 text-right font-semibold text-white">
                      {currencyFormatter.format(Number(order.grand_total))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Low Stock Variants */}
      <section className="admin-card p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-200">
          <Package2 size={16} className="text-amber-300" /> Low Stock Variants
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {sortedAlerts.length === 0 ? (
            <div className="col-span-full rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm text-emerald-200">
              Inventory levels are healthy.
            </div>
          ) : (
            sortedAlerts.map((item) => {
              const isRed = item.stock_quantity <= STOCK_THRESHOLD_RED;
              const isOrange = item.stock_quantity <= STOCK_THRESHOLD_ORANGE && !isRed;
              const borderColor = isRed
                ? "border-red-500/40"
                : isOrange
                  ? "border-orange-500/30"
                  : "border-amber-500/20";
              const bgColor = isRed
                ? "bg-red-500/10"
                : isOrange
                  ? "bg-orange-500/10"
                  : "bg-amber-500/10";
              const stockColor = isRed
                ? "text-red-300"
                : isOrange
                  ? "text-orange-300"
                  : "text-amber-200";

              return (
                <div key={item.id} className={`rounded-xl border ${borderColor} ${bgColor} p-3`}>
                  <p className="text-sm font-semibold text-white">{item.product_name}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-amber-100">{item.size} / {item.color_name}</p>
                  <p className="mt-1 text-xs text-slate-300">{item.sku}</p>
                  <p className={`mt-2 text-sm font-semibold ${stockColor}`}>
                    {item.stock_quantity} units left
                    {isRed ? " ⚠️" : ""}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-200 transition hover:bg-amber-400/20">
                      <RotateCcw size={10} className="mr-1 inline" />Restock
                    </button>
                    <button className="rounded-lg border border-slate-500/30 bg-slate-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-300 transition hover:bg-slate-500/20">
                      Order More
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
