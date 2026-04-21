"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";

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

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors }
  } = useForm<ShippingFormValues>({
    resolver: zodResolver(shippingSchema),
    defaultValues: {
      payment_method: "mock"
    }
  });

  const createOrder = useMutation({
    mutationFn: async (values: ShippingFormValues) => {
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
      setSubmitMessage("Order placed successfully.");
      if (data?.id) {
        router.push(`/orders/${data.id}`);
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

  const onSubmit = (values: ShippingFormValues) => {
    setSubmitMessage(null);

    if (step < 2) {
      setStep((prev) => Math.min(steps.length - 1, prev + 1));
      return;
    }

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
        setSubmitMessage(getApiErrorMessage(error, "Unable to place order. Please review your input."));
      }
    });
  };

  const subtotal = Number(cart?.subtotal || 0);
  const shipping = subtotal >= 200 ? 0 : 15;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;
  const values = watch();

  return (
    <section className="container-shell py-12">
      <h1 className="mb-8 font-display text-5xl uppercase">Checkout</h1>

      <div className="mb-8 grid grid-cols-2 gap-2 md:grid-cols-4">
        {steps.map((label, index) => (
          <button
            key={label}
            type="button"
            onClick={() => setStep(index)}
            className={`rounded-lg px-3 py-2 text-center text-xs uppercase tracking-[0.2em] transition ${
              index <= step ? "bg-red-600 text-white" : "border border-white/20 text-white/60 hover:border-white/35"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <form onSubmit={handleSubmit(onSubmit)} className="card-surface space-y-4 p-6">
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
            </>
          ) : null}

          {step === 3 ? (
            <>
              <h2 className="font-display text-3xl uppercase">Review</h2>
              <div className="space-y-3 rounded-xl border border-white/10 p-4 text-sm text-white/80">
                <p>
                  <span className="text-white">Name:</span> {values.first_name} {values.last_name}
                </p>
                <p>
                  <span className="text-white">Address:</span> {values.address_line1}, {values.city}, {values.state}, {values.country}
                </p>
                <p>
                  <span className="text-white">Postal Code:</span> {values.postal_code}
                </p>
                <p>
                  <span className="text-white">Phone:</span> {values.phone}
                </p>
                <p>
                  <span className="text-white">Payment:</span> {values.payment_method}
                </p>
                {!user ? (
                  <p>
                    <span className="text-white">Guest Email:</span> {values.guest_email || "Not provided"}
                  </p>
                ) : null}
              </div>
            </>
          ) : null}

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              onClick={() => setStep((prev) => Math.max(0, prev - 1))}
              disabled={step === 0}
              className="rounded-full border border-white/30 px-5 py-2 text-xs uppercase tracking-[0.2em]"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep((prev) => Math.min(steps.length - 1, prev + 1))}
              disabled={step === steps.length - 1}
              className="rounded-full border border-white/30 px-5 py-2 text-xs uppercase tracking-[0.2em]"
            >
              Next
            </button>

            {step >= 2 ? (
              <button
                type="submit"
                disabled={createOrder.isPending}
                className="rounded-full bg-red-600 px-6 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white disabled:opacity-50"
              >
                {createOrder.isPending ? "Placing..." : "Place Order"}
              </button>
            ) : null}
          </div>

          {createOrder.isSuccess || submitMessage ? (
            <p className={`text-sm ${createOrder.isError ? "text-red-400" : "text-emerald-400"}`}>
              {submitMessage || "Order placed successfully."}
            </p>
          ) : null}
        </form>

        <aside className="card-surface h-fit space-y-3 p-6 text-sm">
          <h3 className="font-display text-3xl uppercase">Order Summary</h3>
          <p className="flex justify-between text-white/75">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </p>
          <p className="flex justify-between text-white/75">
            <span>Shipping</span>
            <span>${shipping.toFixed(2)}</span>
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
