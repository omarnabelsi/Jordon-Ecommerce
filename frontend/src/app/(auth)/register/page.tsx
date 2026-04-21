"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { RegisterValues, registerSchema } from "@/lib/validators/auth";
import { useAuthStore } from "@/store/auth-store";

export default function RegisterPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema)
  });

  const registerMutation = useMutation({
    mutationFn: async (values: RegisterValues) => {
      const response = await api.post("/auth/register/", values);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.user) {
        setUser(data.user);
        router.push("/account");
      }
    }
  });

  return (
    <section className="container-shell py-14">
      <div className="mx-auto w-full max-w-2xl card-surface p-8">
        <p className="text-xs uppercase tracking-[0.35em] text-red-400">Create Account</p>
        <h1 className="font-display text-5xl uppercase">Join The Club</h1>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit((values) => registerMutation.mutate(values))}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2 text-sm">
              <span className="font-semibold text-white">First Name</span>
              <Input {...register("first_name")} placeholder="John" />
              {errors.first_name ? <span className="text-xs text-red-400">{errors.first_name.message}</span> : null}
            </label>
            <label className="block space-y-2 text-sm">
              <span className="font-semibold text-white">Last Name</span>
              <Input {...register("last_name")} placeholder="Doe" />
              {errors.last_name ? <span className="text-xs text-red-400">{errors.last_name.message}</span> : null}
            </label>
          </div>

          <label className="block space-y-2 text-sm">
            <span className="font-semibold text-white">Email</span>
            <Input type="email" {...register("email")} placeholder="you@example.com" />
            {errors.email ? <span className="text-xs text-red-400">{errors.email.message}</span> : null}
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2 text-sm">
              <span className="font-semibold text-white">Password</span>
              <Input type="password" {...register("password")} placeholder="••••••••" />
              {errors.password ? <span className="text-xs text-red-400">{errors.password.message}</span> : null}
            </label>
            <label className="block space-y-2 text-sm">
              <span className="font-semibold text-white">Confirm Password</span>
              <Input type="password" {...register("confirm_password")} placeholder="••••••••" />
              {errors.confirm_password ? <span className="text-xs text-red-400">{errors.confirm_password.message}</span> : null}
            </label>
          </div>

          <button
            type="submit"
            className="w-full rounded-full bg-red-600 px-6 py-3 text-xs font-bold uppercase tracking-[0.22em] text-white transition hover:bg-red-700 disabled:opacity-50"
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? "Creating..." : "Create Account"}
          </button>

          {registerMutation.isSuccess ? (
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3">
              <p className="text-sm text-emerald-400">✓ Account created successfully. Redirecting...</p>
            </div>
          ) : null}
          {registerMutation.isError ? (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3">
              <p className="text-sm text-red-400">Could not create account. Please try again.</p>
            </div>
          ) : null}
        </form>

        <p className="mt-6 border-t border-white/10 pt-6 text-sm text-white/65">
          Already have an account? <Link href="/login" className="font-semibold text-red-400 hover:text-red-300">
            Sign in
          </Link>
        </p>
      </div>
    </section>
  );
}
