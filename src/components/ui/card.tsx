import * as React from "react";

type DivProps = React.HTMLAttributes<HTMLDivElement>;
type HProps = React.HTMLAttributes<HTMLHeadingElement>;

export function Card({ className = "", ...props }: DivProps) {
  return (
    <div
      className={`rounded-2xl border bg-white shadow dark:border-slate-700 dark:bg-slate-800 ${className}`}
      {...props}
    />
  );
}

export function CardHeader({ className = "", ...props }: DivProps) {
  return <div className={`px-4 pt-4 ${className}`} {...props} />;
}

export function CardTitle({ className = "", ...props }: HProps) {
  return (
    <h3
      className={`text-lg font-semibold leading-tight text-slate-900 dark:text-slate-100 ${className}`}
      {...props}
    />
  );
}

export function CardContent({ className = "", ...props }: DivProps) {
  return <div className={`p-4 ${className}`} {...props} />;
}
