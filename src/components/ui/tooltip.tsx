import * as React from "react";

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  // Minimalny provider – w tej lekkiej wersji nic nie robi, tylko udostępnia kontekst
  return <>{children}</>;
}

export function Tooltip({ children }: { children: React.ReactNode }) {
  // Kontener z klasą group do obsługi hovera
  return <span className="relative inline-block group">{children}</span>;
}

export function TooltipTrigger({
  asChild = false,
  children,
}: {
  asChild?: boolean;
  children: React.ReactNode;
}) {
  // Jeśli asChild = true, nie generujemy dodatkowego wrappera
  return <span className={asChild ? "contents" : ""}>{children}</span>;
}

export function TooltipContent({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  // Prosty tooltip pojawiający się przy hoverze na .group
  return (
    <span
      className={
        "invisible group-hover:visible absolute z-50 translate-y-1 " +
        "left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg border " +
        "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 " +
        "px-2 py-1 text-xs shadow " +
        className
      }
    >
      {children}
    </span>
  );
}
