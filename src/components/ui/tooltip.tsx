import * as React from "react";

export function TooltipTrigger({ children }: { children: React.ReactNode }) {
  return <span className="underline decoration-dotted cursor-help">{children}</span>;
}

export function TooltipContent({ children }: { children: React.ReactNode }) {
  return <span className="absolute mt-1 rounded bg-black text-white text-xs px-2 py-1">{children}</span>;
}
