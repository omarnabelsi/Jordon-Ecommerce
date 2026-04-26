"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { ReactNode, Suspense } from "react";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/header";
import { ToastContainer } from "@/components/ui/toast";

interface SiteShellProps {
  children: ReactNode;
}

export function SiteShell({ children }: SiteShellProps) {
  const pathname = usePathname();

  const isAdmin = pathname?.startsWith("/admin");

  return (
    <>
      {!isAdmin && (
        <Suspense fallback={<div className="h-20 border-b border-white/10 bg-black/60 backdrop-blur-xl" />}>
          <Navbar />
        </Suspense>
      )}
      <AnimatePresence mode="wait" initial={false}>
        {/* Key the main container by pathname for subtle route-to-route transitions. */}
        <motion.main
          key={pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          {children}
        </motion.main>
      </AnimatePresence>
      {!isAdmin && <Footer />}
      <ToastContainer />
    </>
  );
}

