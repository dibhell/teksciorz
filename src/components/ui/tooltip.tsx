import * as React from "react";

/** Lekki tooltip zgodny nazwami z shadcn: Tooltip, TooltipTrigger, TooltipContent, TooltipProvider */

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function Tooltip({ children }: { children: React.ReactNode }) {
  return <span className="relative inline-block group">{children}</span>;
}

export function TooltipTrigger({
  asChild = false,
  children,
}: {
  asChild?: boolean;
  children: React.ReactNode;
}) {
  return <span className={asChild ? "contents" : ""}>{children}</span>;
}

export function TooltipContent({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={
        "pointer-events-none invisible group-hover:visible absolute z-50 left-1/2 -translate-x-1/2 translate-y-1 " +
        "whitespace-nowrap rounded-md border bg-white px-2 py-1 text-xs text-slate-900 shadow " +
        "dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 " + className
      }
      role="tooltip"
    >
      {children}
    </span>
  );
}
