import { forwardRef, InputHTMLAttributes } from "react";
import clsx from "clsx";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={clsx(
          "focus-ring h-11 w-full rounded-xl border border-white/20 bg-black/55 px-4 text-sm text-white placeholder:text-white/45",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
