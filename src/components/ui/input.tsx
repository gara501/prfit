import type * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "flex h-11 w-full min-w-0 rounded-lg border border-input bg-background px-3 py-2 text-body text-foreground shadow-none outline-none transition-colors placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25",
        "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20",
        className,
      )}
      data-slot="input"
      type={type}
      {...props}
    />
  );
}

export { Input };
