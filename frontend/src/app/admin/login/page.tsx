"use client";

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ShieldCheck, ShieldX } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";

interface LoginResponse {
  user?: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    phone?: string;
    avatar?: string;
    is_staff?: boolean;
    is_superuser?: boolean;
  };
}

export default function AdminLoginPage() {
  const router = useRouter();
  const { setUser, clearUser } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [nextPath, setNextPath] = useState("/admin/dashboard");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const next = new URLSearchParams(window.location.search).get("next") || "/admin/dashboard";
    setNextPath(next.startsWith("/admin") ? next : "/admin/dashboard");
  }, []);

  const loginMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post<LoginResponse>("/auth/login/", {
        email,
        password,
        remember_me: rememberMe
      });
      return response.data;
    },
    onSuccess: async (data) => {
      if (!data.user?.is_staff) {
        setAccessError("This account does not have admin permissions.");
        clearUser();
        try {
          await api.post("/auth/logout/");
        } catch {
          // Ignore cleanup errors for unauthorized users.
        }
        return;
      }

      setUser(data.user);
      setAccessError(null);
      router.replace(nextPath);
    },
    onError: () => {
      setAccessError("Invalid email or password.");
      clearUser();
    }
  });

  return (
    <section className="admin-page-bg min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-6 py-10">
        <div className="grid w-full gap-8 md:grid-cols-[1.1fr_0.9fr]">
          <div className="admin-card p-10">
            <p className="text-xs uppercase tracking-[0.35em] text-red-200/70">Executive Access</p>
            <h1 className="mt-3 text-5xl font-semibold leading-tight text-white">Jumpman Ops Command Center</h1>
            <p className="mt-4 max-w-lg text-sm text-slate-300">
              Monitor revenue, orchestrate fulfillment, manage inventory risk, and control customer operations from one premium cockpit.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
                <ShieldCheck className="text-red-300" size={18} />
                <p className="mt-2 text-sm font-semibold text-white">Staff-Only Access</p>
                <p className="mt-1 text-xs text-slate-300">Role-guarded endpoints with secure cookie auth.</p>
              </div>
              <div className="rounded-2xl border border-red-700/25 bg-red-900/15 p-4">
                <ShieldX className="text-red-300" size={18} />
                <p className="mt-2 text-sm font-semibold text-white">Rate-Limited Login</p>
                <p className="mt-1 text-xs text-slate-300">Brute-force resistance with throttle controls.</p>
              </div>
            </div>
          </div>

          <div className="admin-card p-8">
            <p className="text-xs uppercase tracking-[0.35em] text-red-200/70">Sign In</p>
            <h2 className="mt-2 text-3xl font-semibold text-white">Admin Login</h2>

            <form
              className="mt-6 space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                setAccessError(null);
                loginMutation.mutate();
              }}
            >
              <label className="block space-y-2 text-sm">
                <span className="font-semibold text-slate-100">Email</span>
                <Input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@jumpman.com"
                  required
                />
              </label>

              <label className="block space-y-2 text-sm">
                <span className="font-semibold text-slate-100">Password</span>
                <Input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  required
                />
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-900"
                />
                Keep session active (remember this device)
              </label>

              <button
                type="submit"
                className="w-full rounded-xl bg-gradient-to-r from-red-600 to-red-800 px-5 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-white transition hover:brightness-110 disabled:opacity-60"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Authenticating..." : "Enter Command Center"}
              </button>
            </form>

            {accessError ? (
              <p className="mt-4 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{accessError}</p>
            ) : null}

            <p className="mt-5 text-xs text-slate-400">
              Need a customer account? <Link href="/register" className="text-red-300 hover:text-red-200">Open standard signup</Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
