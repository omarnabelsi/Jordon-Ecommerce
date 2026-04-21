import { ButtonHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost";
  children: ReactNode;
}

export function Button({ variant = "primary", className, children, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        "focus-ring inline-flex items-center justify-center rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-[0.22em] transition",
        {
          "bg-red-600 text-white hover:bg-red-500": variant === "primary",
          "border border-white/30 bg-transparent text-white hover:border-red-500": variant === "outline",
          "bg-transparent text-white/80 hover:text-white": variant === "ghost"
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
