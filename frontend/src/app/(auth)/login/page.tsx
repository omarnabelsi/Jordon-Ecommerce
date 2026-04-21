"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { LoginValues, loginSchema } from "@/lib/validators/auth";
import { useAuthStore } from "@/store/auth-store";

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema)
  });

  const loginMutation = useMutation({
    mutationFn: async (values: LoginValues) => {
      const response = await api.post("/auth/login/", values);
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
      <div className="mx-auto w-full max-w-xl card-surface p-8">
        <p className="text-xs uppercase tracking-[0.35em] text-red-400">Welcome Back</p>
        <h1 className="font-display text-5xl uppercase">Sign In</h1>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit((values) => loginMutation.mutate(values))}>
          <label className="block space-y-2 text-sm">
            <span className="font-semibold text-white">Email</span>
            <Input type="email" {...register("email")} placeholder="you@example.com" />
            {errors.email ? <span className="text-xs text-red-400">{errors.email.message}</span> : null}
          </label>

          <label className="block space-y-2 text-sm">
            <span className="font-semibold text-white">Password</span>
            <Input type="password" {...register("password")} placeholder="••••••••" />
            {errors.password ? <span className="text-xs text-red-400">{errors.password.message}</span> : null}
          </label>

          <button
            type="submit"
            className="w-full rounded-full bg-red-600 px-6 py-3 text-xs font-bold uppercase tracking-[0.22em] text-white transition hover:bg-red-700 disabled:opacity-50"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? "Signing In..." : "Sign In"}
          </button>

          {loginMutation.isError ? (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3">
              <p className="text-sm text-red-400">Invalid email or password. Please try again.</p>
            </div>
          ) : null}
          {loginMutation.isSuccess ? (
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3">
              <p className="text-sm text-emerald-400">✓ Login successful. Redirecting...</p>
            </div>
          ) : null}
        </form>

        <div className="mt-6 space-y-4 border-t border-white/10 pt-6">
          <p className="text-sm text-white/65">
            No account? <Link href="/register" className="font-semibold text-red-400 hover:text-red-300">
              Create one
            </Link>
          </p>
          <Link
            href="/password-reset"
            className="block text-sm text-white/60 hover:text-white transition"
          >
            Forgot your password?
          </Link>
        </div>
      </div>
    </section>
  );
}
