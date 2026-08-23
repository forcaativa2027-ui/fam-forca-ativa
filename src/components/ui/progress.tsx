"use client";
import * as React from "react";

/**
 * ACA-UX-001 Fase B — primitivo de progresso, no padrão shadcn
 * (mesma API: value 0-100), mas sem depender do pacote
 * @radix-ui/react-progress (evita adicionar dependência nova só
 * pra isso — um <div> com ARIA correto já cobre o caso de uso).
 * Cor de marca (gold) e respeita CT-017 (dark mode via variáveis
 * CSS já existentes, animação reduzida/desativada herdada global).
 */
export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  indicatorClassName?: string;
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ value = 0, className = "", indicatorClassName = "", ...props }, ref) => {
    const clamped = Math.min(100, Math.max(0, value));
    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={clamped}
        className={`relative h-2 w-full overflow-hidden rounded-full bg-navy/10 ${className}`}
        {...props}
      >
        <div
          className={`h-full rounded-full bg-gold transition-all duration-500 ease-out ${indicatorClassName}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    );
  }
);
Progress.displayName = "Progress";
