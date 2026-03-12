import * as React from "react";

import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-12 w-full rounded-2xl border border-white/70 bg-white/70 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-2 focus:ring-sky-200",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
