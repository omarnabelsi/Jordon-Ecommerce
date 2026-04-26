"use client";

import { CheckCircle2, X, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export interface ToastData {
  id: string;
  type: "success" | "error";
  message: string;
}

let toastListener: ((toast: ToastData) => void) | null = null;

export function showToast(type: "success" | "error", message: string) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  toastListener?.({ id, type, message });
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((toast: ToastData) => {
    setToasts((prev) => [...prev, toast]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    toastListener = addToast;
    return () => {
      toastListener = null;
    };
  }, [addToast]);

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: ToastData; onDismiss: (id: string) => void }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    const enterTimer = requestAnimationFrame(() => setIsVisible(true));

    // Auto-dismiss after 3s
    const dismissTimer = window.setTimeout(() => {
      setIsExiting(true);
      window.setTimeout(() => onDismiss(toast.id), 320);
    }, 3000);

    return () => {
      cancelAnimationFrame(enterTimer);
      window.clearTimeout(dismissTimer);
    };
  }, [toast.id, onDismiss]);

  const handleDismiss = () => {
    setIsExiting(true);
    window.setTimeout(() => onDismiss(toast.id), 320);
  };

  const isSuccess = toast.type === "success";

  return (
    <div
      className={`flex min-w-[300px] max-w-[420px] items-center gap-3 rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-2xl transition-all duration-300 ${
        isVisible && !isExiting
          ? "translate-y-0 opacity-100"
          : "translate-y-4 opacity-0"
      } ${
        isSuccess
          ? "border-emerald-500/30 bg-emerald-950/80 text-emerald-100"
          : "border-red-500/30 bg-red-950/80 text-red-100"
      }`}
    >
      {isSuccess ? (
        <CheckCircle2 size={18} className="shrink-0 text-emerald-400" />
      ) : (
        <XCircle size={18} className="shrink-0 text-red-400" />
      )}
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        onClick={handleDismiss}
        className="shrink-0 rounded-full p-1 transition hover:bg-white/10"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}
