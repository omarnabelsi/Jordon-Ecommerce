"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  ShoppingBag,
  MapPin,
  CreditCard,
  Truck,
  FileText,
  ArrowRight,
  Package,
  Mail
} from "lucide-react";

interface OrderData {
  id: number;
  order_number: string;
  status: string;
  total_amount: string;
  shipping_amount: string;
  tax_amount: string;
  grand_total: string;
  shipping_address: Record<string, string>;
  payment_method: string;
  payment_status: string;
  created_at: string;
  items: Array<{
    id: number;
    product_name: string;
    product_variant: number;
    quantity: number;
    unit_price: string;
    total_price: string;
  }>;
}

interface CheckoutValues {
  first_name: string;
  last_name: string;
  address_line1: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
  card_number?: string;
  guest_email?: string;
}

function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    if (result.getDay() !== 0 && result.getDay() !== 6) {
      added++;
    }
  }
  return result;
}

export default function OrderConfirmationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [checkoutValues, setCheckoutValues] = useState<CheckoutValues | null>(null);

  useEffect(() => {
    const storedOrder = sessionStorage.getItem("last_order");
    const storedValues = sessionStorage.getItem("last_checkout_values");

    if (storedOrder) {
      try {
        setOrder(JSON.parse(storedOrder));
      } catch {
        // invalid JSON
      }
    }
    if (storedValues) {
      try {
        setCheckoutValues(JSON.parse(storedValues));
      } catch {
        // invalid JSON
      }
    }
  }, []);

  if (!order) {
    return (
      <section className="container-shell py-20 text-center">
        <div className="mx-auto max-w-md">
          <Package size={48} className="mx-auto text-white/30" />
          <h1 className="mt-4 font-display text-4xl uppercase text-white">No Order Found</h1>
          <p className="mt-2 text-sm text-white/60">
            We couldn&apos;t find your order details. Please check your orders page.
          </p>
          <Link
            href="/products"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-red-600 px-6 py-3 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-red-500"
          >
            Continue Shopping <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    );
  }

  const orderDate = new Date(order.created_at);
  const estimatedDelivery = addBusinessDays(orderDate, 5);
  const customerEmail = checkoutValues?.guest_email || "your registered email";
  const cardLast4 = checkoutValues?.card_number
    ? checkoutValues.card_number.replace(/\s/g, "").slice(-4)
    : "4242";

  const shippingAddr = order.shipping_address;
  const fullAddress = [
    shippingAddr.address_line1,
    shippingAddr.city,
    shippingAddr.state,
    shippingAddr.postal_code,
    shippingAddr.country
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <section className="container-shell py-12">
      {/* Success Header */}
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 ring-4 ring-emerald-500/30">
          <CheckCircle2 size={40} className="text-emerald-400" />
        </div>
        <h1 className="font-display text-5xl uppercase text-white">Thank You for Your Order!</h1>
        <p className="mt-3 text-lg text-white/60">
          Your order has been placed and is being processed.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/[0.05] px-5 py-2 text-sm">
          <span className="text-white/50">Order Number:</span>
          <span className="font-mono font-bold text-red-400">{order.order_number}</span>
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-6">
        {/* Order Items */}
        <div className="card-surface p-6">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white/80">
            <ShoppingBag size={16} className="text-red-400" />
            Order Summary
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-white/40">
                  <th className="px-3 py-3">Product</th>
                  <th className="px-3 py-3">Quantity</th>
                  <th className="px-3 py-3 text-right">Unit Price</th>
                  <th className="px-3 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id} className="border-b border-white/5">
                    <td className="px-3 py-3">
                      <p className="font-semibold text-white">{item.product_name}</p>
                    </td>
                    <td className="px-3 py-3 text-white/70">{item.quantity}</td>
                    <td className="px-3 py-3 text-right text-white/70">${Number(item.unit_price).toFixed(2)}</td>
                    <td className="px-3 py-3 text-right font-semibold text-white">${Number(item.total_price).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order Details Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Shipping Address */}
          <div className="card-surface p-5">
            <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/60">
              <MapPin size={14} className="text-red-400" />
              Shipping Address
            </h3>
            <p className="text-sm font-semibold text-white">
              {shippingAddr.first_name} {shippingAddr.last_name}
            </p>
            <p className="mt-1 text-sm text-white/70">{fullAddress}</p>
            {shippingAddr.phone ? (
              <p className="mt-1 text-sm text-white/50">{shippingAddr.phone}</p>
            ) : null}
          </div>

          {/* Payment Info */}
          <div className="card-surface p-5">
            <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/60">
              <CreditCard size={14} className="text-red-400" />
              Payment Method
            </h3>
            <p className="text-sm font-semibold text-white">
              Card ending in ****{cardLast4}
            </p>
            <p className="mt-1 text-sm text-white/50">
              Payment Status: <span className="capitalize text-emerald-400">{order.payment_status}</span>
            </p>
          </div>

          {/* Order Date */}
          <div className="card-surface p-5">
            <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/60">
              <FileText size={14} className="text-red-400" />
              Order Date
            </h3>
            <p className="text-sm font-semibold text-white">
              {orderDate.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
            <p className="mt-1 text-sm text-white/50">
              {orderDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>

          {/* Estimated Delivery */}
          <div className="card-surface p-5">
            <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/60">
              <Truck size={14} className="text-red-400" />
              Estimated Delivery
            </h3>
            <p className="text-sm font-semibold text-white">
              {estimatedDelivery.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
            <p className="mt-1 text-sm text-white/50">Standard Delivery (3-5 business days)</p>
          </div>
        </div>

        {/* Total Breakdown */}
        <div className="card-surface p-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/60">Total Breakdown</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-white/70">
              <span>Subtotal</span>
              <span>${Number(order.total_amount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-white/70">
              <span>Shipping</span>
              <span>
                {Number(order.shipping_amount) === 0 ? (
                  <span className="text-emerald-400">FREE</span>
                ) : (
                  `$${Number(order.shipping_amount).toFixed(2)}`
                )}
              </span>
            </div>
            <div className="flex justify-between text-white/70">
              <span>Tax</span>
              <span>${Number(order.tax_amount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-white/20 pt-3 text-lg font-bold text-white">
              <span>Total</span>
              <span>${Number(order.grand_total).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Email Confirmation Note */}
        <div className="flex items-center gap-3 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-4">
          <Mail size={20} className="shrink-0 text-emerald-400" />
          <p className="text-sm text-emerald-200">
            A confirmation email has been sent to <strong className="text-emerald-100">{customerEmail}</strong>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="/products"
            className="flex items-center gap-2 rounded-full bg-red-600 px-6 py-3 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-red-500"
          >
            <ShoppingBag size={16} />
            Continue Shopping
          </Link>
          <Link
            href={`/orders/${order.id}`}
            className="flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm font-semibold uppercase tracking-wider text-white transition hover:border-white/40"
          >
            <Package size={16} />
            View Order Status
          </Link>
          <button
            onClick={() => {
              window.print();
            }}
            className="flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm font-semibold uppercase tracking-wider text-white transition hover:border-white/40"
          >
            <FileText size={16} />
            Download Invoice
          </button>
        </div>
      </div>
    </section>
  );
}
