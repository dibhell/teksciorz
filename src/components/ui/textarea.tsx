import * as React from "react";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={`w-full rounded-2xl border p-2 dark:bg-gray-900 dark:text-white ${className}`}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";
