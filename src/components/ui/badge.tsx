import * as React from "react";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "outline" | "destructive";
};

export function Badge({ className = "", variant = "default", ...props }: BadgeProps) {
  const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold";
  const variants = {
    default: "bg-blue-600 text-white",
    outline: "border border-gray-400 text-gray-800 dark:text-gray-200",
    destructive: "bg-red-600 text-white",
  } as const;

  return <span className={`${base} ${variants[variant]} ${className}`} {...props} />;
}
