import * as React from "react";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className = "", ...props }, ref) => (
    <input
      ref={ref}
      className={`w-full rounded-2xl border px-3 py-2 bg-white dark:bg-slate-900 dark:text-white ${className}`}
      {...props}
    />
  )
);
Input.displayName = "Input";
