"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  Loader2,
  Lock,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  CheckCircle2
} from "lucide-react";

import { useCart } from "@/hooks/use-cart";
import { api } from "@/lib/api";
import { ShippingFormValues, shippingSchema } from "@/lib/validators/checkout";
import { useAuthStore } from "@/store/auth-store";

const steps = ["Shipping", "Method", "Payment", "Review"];

export default function CheckoutPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const { data: cart } = useCart();
  const user = useAuthStore((state) => state.user);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    trigger,
    formState: { errors }
  } = useForm<ShippingFormValues>({
    resolver: zodResolver(shippingSchema),
    defaultValues: {
      payment_method: "mock"
    }
  });

  const createOrder = useMutation({
    mutationFn: async (values: ShippingFormValues) => {
      // Simulate a short processing delay for UX
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const response = await api.post("/orders/create/", {
        shipping_address: {
          first_name: values.first_name,
          last_name: values.last_name,
          address_line1: values.address_line1,
          city: values.city,
          state: values.state,
          postal_code: values.postal_code,
          country: values.country,
          phone: values.phone
        },
        payment_method: values.payment_method,
        guest_email: values.guest_email
      });
      return response.data;
    },
    onSuccess: (data) => {
      // Store order data for confirmation page
      if (typeof window !== "undefined") {
        sessionStorage.setItem("last_order", JSON.stringify(data));
        sessionStorage.setItem("last_checkout_values", JSON.stringify(watch()));
      }
      setSubmitMessage("Order placed successfully!");
      setSubmitError(false);
      if (data?.id) {
        router.push(`/checkout/confirmation?order_id=${data.id}`);
      }
    }
  });

  const getApiErrorMessage = (error: unknown, fallback: string) => {
    if (!error || typeof error !== "object") return fallback;

    const maybeResponse = (error as { response?: { data?: unknown } }).response;
    const data = maybeResponse?.data;

    if (typeof data === "string") return data;
    if (data && typeof data === "object") {
      const detail = (data as { detail?: string }).detail;
      if (detail) return detail;

      const firstEntry = Object.values(data as Record<string, unknown>)[0];
      if (Array.isArray(firstEntry) && typeof firstEntry[0] === "string") {
        return firstEntry[0];
      }
      if (typeof firstEntry === "string") {
        return firstEntry;
      }
    }

    return fallback;
  };

  const onSubmit = async (values: ShippingFormValues) => {
    setSubmitMessage(null);
    setSubmitError(false);

    // Steps 0-1: just advance
    if (step < 2) {
      setStep((prev) => Math.min(steps.length - 1, prev + 1));
      return;
    }

    // Step 2 (Payment): validate card fields, then advance to Review
    if (step === 2) {
      if (values.payment_method === "mock") {
        // Validate card fields for mock payment
        const cardValid = await trigger(["card_number", "card_expiry", "card_cvv"]);

        if (values.card_number || values.card_expiry || values.card_cvv) {
          if (!cardValid) return;
        }
      }

      if (!user && !values.guest_email?.trim()) {
        setError("guest_email", {
          type: "manual",
          message: "Guest email is required when you are not signed in."
        });
        return;
      }

      setStep(3);
      return;
    }

    // Step 3 (Review): place the order
    if (step === 3) {
      if (!user && !values.guest_email?.trim()) {
        setError("guest_email", {
          type: "manual",
          message: "Guest email is required when you are not signed in."
        });
        setStep(2);
        return;
      }

      createOrder.mutate(values, {
        onError: (error) => {
          setSubmitError(true);
          setSubmitMessage(
            getApiErrorMessage(error, "Payment failed – please try again.")
          );
        }
      });
    }
  };

  const subtotal = Number(cart?.subtotal || 0);
  const shipping = subtotal >= 200 ? 0 : 15;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;
  const values = watch();

  const formatCardNumber = (value: string) => {
    return value
      .replace(/\s/g, "")
      .replace(/(\d{4})/g, "$1 ")
      .trim();
  };

  return (
    <section className="container-shell py-12">
      <h1 className="mb-8 font-display text-5xl uppercase">Checkout</h1>

      {/* Step Indicator */}
      <div className="mb-8 grid grid-cols-2 gap-2 md:grid-cols-4">
        {steps.map((label, index) => (
          <button
            key={label}
            type="button"
            onClick={() => setStep(index)}
            className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-center text-xs uppercase tracking-[0.2em] transition ${
              index < step
                ? "bg-emerald-600/80 text-white"
                : index === step
                  ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                  : "border border-white/20 text-white/60 hover:border-white/35"
            }`}
          >
            {index < step ? <CheckCircle2 size={14} /> : null}
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <form onSubmit={handleSubmit(onSubmit)} className="card-surface space-y-4 p-6">
          {/* Step 0: Shipping */}
          {step === 0 ? (
            <>
              <h2 className="font-display text-3xl uppercase">Shipping Address</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1 text-sm">
                  <span>First Name</span>
                  <input className="focus-ring h-11 w-full rounded-lg border border-white/20 bg-black px-3" {...register("first_name")} />
                  {errors.first_name ? <span className="text-xs text-red-400">{errors.first_name.message}</span> : null}
                </label>
                <label className="space-y-1 text-sm">
                  <span>Last Name</span>
                  <input className="focus-ring h-11 w-full rounded-lg border border-white/20 bg-black px-3" {...register("last_name")} />
                  {errors.last_name ? <span className="text-xs text-red-400">{errors.last_name.message}</span> : null}
                </label>
              </div>

              <label className="space-y-1 text-sm block">
                <span>Address</span>
                <input className="focus-ring h-11 w-full rounded-lg border border-white/20 bg-black px-3" {...register("address_line1")} />
                {errors.address_line1 ? <span className="text-xs text-red-400">{errors.address_line1.message}</span> : null}
              </label>

              <div className="grid gap-4 sm:grid-cols-3">
                <label className="space-y-1 text-sm">
                  <span>City</span>
                  <input className="focus-ring h-11 w-full rounded-lg border border-white/20 bg-black px-3" {...register("city")} />
                  {errors.city ? <span className="text-xs text-red-400">{errors.city.message}</span> : null}
                </label>
                <label className="space-y-1 text-sm">
                  <span>State</span>
                  <input className="focus-ring h-11 w-full rounded-lg border border-white/20 bg-black px-3" {...register("state")} />
                  {errors.state ? <span className="text-xs text-red-400">{errors.state.message}</span> : null}
                </label>
                <label className="space-y-1 text-sm">
                  <span>Postal Code</span>
                  <input className="focus-ring h-11 w-full rounded-lg border border-white/20 bg-black px-3" {...register("postal_code")} />
                  {errors.postal_code ? <span className="text-xs text-red-400">{errors.postal_code.message}</span> : null}
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1 text-sm">
                  <span>Country</span>
                  <input className="focus-ring h-11 w-full rounded-lg border border-white/20 bg-black px-3" {...register("country")} />
                  {errors.country ? <span className="text-xs text-red-400">{errors.country.message}</span> : null}
                </label>
                <label className="space-y-1 text-sm">
                  <span>Phone</span>
                  <input className="focus-ring h-11 w-full rounded-lg border border-white/20 bg-black px-3" {...register("phone")} />
                  {errors.phone ? <span className="text-xs text-red-400">{errors.phone.message}</span> : null}
                </label>
              </div>
            </>
          ) : null}

          {/* Step 1: Shipping Method */}
          {step === 1 ? (
            <>
              <h2 className="font-display text-3xl uppercase">Shipping Method</h2>
              <div className="rounded-xl border border-white/10 p-4">
                <p className="text-sm font-semibold text-white">Standard Delivery</p>
                <p className="text-sm text-white/60">3-5 business days</p>
                <p className="mt-2 text-sm text-red-400">{shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</p>
              </div>
              <p className="text-sm text-white/60">Express options are coming soon.</p>
            </>
          ) : null}

          {/* Step 2: Payment */}
          {step === 2 ? (
            <>
              <h2 className="font-display text-3xl uppercase">Payment</h2>

              {!user ? (
                <label className="space-y-1 text-sm block">
                  <span>Guest Email (required if not signed in)</span>
                  <input className="focus-ring h-11 w-full rounded-lg border border-white/20 bg-black px-3" {...register("guest_email")} />
                  {errors.guest_email ? <span className="text-xs text-red-400">{errors.guest_email.message}</span> : null}
                </label>
              ) : null}

              <label className="space-y-1 text-sm block">
                <span>Payment Method</span>
                <select className="focus-ring h-11 w-full rounded-lg border border-white/20 bg-black px-3" {...register("payment_method")}>
                  <option value="mock">Mock Payment</option>
                  <option value="stripe">Stripe (Placeholder)</option>
                </select>
              </label>

              {/* Card Details */}
              <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-5">
                <div className="mb-4 flex items-center gap-2">
                  <CreditCard size={20} className="text-red-400" />
                  <p className="text-sm font-semibold text-white">Card Details</p>
                  <Lock size={14} className="ml-auto text-emerald-400" />
                  <span className="text-xs text-emerald-400">Secure</span>
                </div>

                <label className="space-y-1 text-sm block">
                  <span className="text-white/70">Card Number</span>
                  <input
                    className="focus-ring h-11 w-full rounded-lg border border-white/20 bg-black px-3 font-mono tracking-wider"
                    placeholder="4242 4242 4242 4242"
                    maxLength={19}
                    {...register("card_number")}
                  />
                  {errors.card_number ? <span className="text-xs text-red-400">{errors.card_number.message}</span> : null}
                </label>

                <label className="mt-3 space-y-1 text-sm block">
                  <span className="text-white/70">Cardholder Name</span>
                  <input
                    className="focus-ring h-11 w-full rounded-lg border border-white/20 bg-black px-3"
                    placeholder="John Doe"
                    {...register("card_name")}
                  />
                </label>

                <div className="mt-3 grid grid-cols-2 gap-4">
                  <label className="space-y-1 text-sm">
                    <span className="text-white/70">Expiry Date</span>
                    <input
                      className="focus-ring h-11 w-full rounded-lg border border-white/20 bg-black px-3 font-mono"
                      placeholder="MM/YY"
                      maxLength={5}
                      {...register("card_expiry")}
                    />
                    {errors.card_expiry ? <span className="text-xs text-red-400">{errors.card_expiry.message}</span> : null}
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="text-white/70">CVV</span>
                    <input
                      type="password"
                      className="focus-ring h-11 w-full rounded-lg border border-white/20 bg-black px-3 font-mono"
                      placeholder="•••"
                      maxLength={4}
                      {...register("card_cvv")}
                    />
                    {errors.card_cvv ? <span className="text-xs text-red-400">{errors.card_cvv.message}</span> : null}
                  </label>
                </div>

                <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-500/10 p-2 text-xs text-emerald-300">
                  <ShieldCheck size={14} />
                  <span>Your payment information is encrypted and secure</span>
                </div>
              </div>
            </>
          ) : null}

          {/* Step 3: Review */}
          {step === 3 ? (
            <>
              <h2 className="font-display text-3xl uppercase">Review Your Order</h2>
              <div className="space-y-3 rounded-xl border border-white/10 p-5 text-sm text-white/80">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-white/40">Name</p>
                    <p className="font-semibold text-white">{values.first_name} {values.last_name}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-white/40">Phone</p>
                    <p className="text-white">{values.phone}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-white/40">Shipping Address</p>
                  <p className="text-white">{values.address_line1}, {values.city}, {values.state} {values.postal_code}, {values.country}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-white/40">Payment</p>
                    <p className="text-white">{values.payment_method === "mock" ? "Card Payment" : "Stripe"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-white/40">Card</p>
                    <p className="font-mono text-white">
                      {values.card_number ? `•••• •••• •••• ${values.card_number.replace(/\s/g, "").slice(-4)}` : "Not provided"}
                    </p>
                  </div>
                </div>
                {!user ? (
                  <div>
                    <p className="text-xs uppercase tracking-wider text-white/40">Guest Email</p>
                    <p className="text-white">{values.guest_email || "Not provided"}</p>
                  </div>
                ) : null}
              </div>

              {/* Cart Items Summary */}
              {cart?.items && cart.items.length > 0 ? (
                <div className="mt-4 space-y-2">
                  <p className="text-xs uppercase tracking-wider text-white/50">Items in Cart</p>
                  {cart.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] p-3 text-sm">
                      <div>
                        <p className="font-semibold text-white">{item.product_name}</p>
                        <p className="text-xs text-white/50">{item.size} / {item.color_name} × {item.quantity}</p>
                      </div>
                      <p className="font-semibold text-white">${Number(item.total_price).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </>
          ) : null}

          {/* Navigation */}
          <div className="flex flex-wrap gap-2 pt-4">
            <button
              type="button"
              onClick={() => setStep((prev) => Math.max(0, prev - 1))}
              disabled={step === 0}
              className="flex items-center gap-1 rounded-full border border-white/30 px-5 py-2.5 text-xs uppercase tracking-[0.2em] transition hover:border-white/50 disabled:opacity-30"
            >
              <ChevronLeft size={14} />
              Back
            </button>

            {step < 3 ? (
              <button
                type="submit"
                className="flex items-center gap-1 rounded-full border border-white/30 px-5 py-2.5 text-xs uppercase tracking-[0.2em] transition hover:border-white/50"
              >
                Next
                <ChevronRight size={14} />
              </button>
            ) : null}

            {step === 3 ? (
              <button
                type="submit"
                disabled={createOrder.isPending}
                className="flex items-center gap-2 rounded-full bg-red-600 px-8 py-3 text-sm font-bold uppercase tracking-[0.2em] text-white shadow-lg shadow-red-600/30 transition hover:bg-red-500 disabled:opacity-50"
              >
                {createOrder.isPending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Lock size={14} />
                    Place Order
                  </>
                )}
              </button>
            ) : null}
          </div>

          {/* Submit feedback */}
          {submitMessage ? (
            <div className={`mt-3 flex items-center gap-2 rounded-lg p-3 text-sm ${
              submitError
                ? "border border-red-400/30 bg-red-500/10 text-red-400"
                : "border border-emerald-400/30 bg-emerald-500/10 text-emerald-400"
            }`}>
              {submitError ? (
                <span>⚠️</span>
              ) : (
                <CheckCircle2 size={16} />
              )}
              {submitMessage}
            </div>
          ) : null}
        </form>

        {/* Order Summary Sidebar */}
        <aside className="card-surface h-fit space-y-3 p-6 text-sm">
          <h3 className="font-display text-3xl uppercase">Order Summary</h3>

          {cart?.items && cart.items.length > 0 ? (
            <div className="space-y-2 border-b border-white/10 pb-3">
              {cart.items.map((item) => (
                <div key={item.id} className="flex justify-between text-white/60">
                  <span className="truncate pr-3">{item.product_name} × {item.quantity}</span>
                  <span>${Number(item.total_price).toFixed(2)}</span>
                </div>
              ))}
            </div>
          ) : null}

          <p className="flex justify-between text-white/75">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </p>
          <p className="flex justify-between text-white/75">
            <span>Shipping</span>
            <span>{shipping === 0 ? <span className="text-emerald-400">FREE</span> : `$${shipping.toFixed(2)}`}</span>
          </p>
          <p className="flex justify-between text-white/75">
            <span>Tax</span>
            <span>${tax.toFixed(2)}</span>
          </p>
          <p className="flex justify-between border-t border-white/20 pt-3 text-base font-bold text-white">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </p>
        </aside>
      </div>
    </section>
  );
}
