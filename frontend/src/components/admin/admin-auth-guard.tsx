"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";

interface AdminAuthGuardProps {
  children: ReactNode;
}

export function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, setUser, clearUser } = useAuthStore();
  const [status, setStatus] = useState<"checking" | "allowed" | "denied">("checking");

  const nextTarget = useMemo(() => encodeURIComponent(pathname), [pathname]);

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      try {
        const response = await api.get("/auth/me/", {
          validateStatus: (code) => code === 200 || code === 401 || code === 403
        });

        if (!isMounted) {
          return;
        }

        if (response.status === 200 && response.data?.is_staff) {
          setUser(response.data);
          setStatus("allowed");
          return;
        }

        if (response.status === 200 && !response.data?.is_staff) {
          setStatus("denied");
          router.replace("/account");
          return;
        }

        clearUser();
        setStatus("denied");
        router.replace(`/admin/login?next=${nextTarget}`);
      } catch {
        if (!isMounted) {
          return;
        }

        if (user?.is_staff) {
          setStatus("allowed");
        } else {
          clearUser();
          setStatus("denied");
          router.replace(`/admin/login?next=${nextTarget}`);
        }
      }
    };

    run();

    return () => {
      isMounted = false;
    };
  }, [clearUser, nextTarget, router, setUser, user?.is_staff]);

  if (status === "checking") {
    return (
      <section className="admin-page-bg min-h-screen">
        <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-6">
          <div className="admin-card w-full max-w-md p-10 text-center">
            <p className="text-xs uppercase tracking-[0.35em] text-red-300/80">Admin Security</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Verifying Access</h1>
            <p className="mt-3 text-sm text-slate-300">Checking credentials and staff permissions.</p>
            <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-800">
              <div className="admin-loader h-full rounded-full" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (status === "denied") {
    return null;
  }

  return <>{children}</>;
}
