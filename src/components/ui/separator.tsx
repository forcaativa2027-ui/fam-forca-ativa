import * as React from "react";

/** ACA-UX-001 Fase B — divisor simples, horizontal ou vertical. */
export function Separator({ orientation = "horizontal", className = "", ...props }: React.HTMLAttributes<HTMLDivElement> & { orientation?: "horizontal" | "vertical" }) {
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={`shrink-0 bg-border ${orientation === "horizontal" ? "h-px w-full" : "h-full w-px"} ${className}`}
      {...props}
    />
  );
}
