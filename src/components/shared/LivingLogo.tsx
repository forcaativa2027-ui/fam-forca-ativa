"use client";
import { useEffect, useState } from "react";
import Image from "next/image";

export type LivingLogoProps = {
  size?: number;
  animated?: boolean;
  showSlogan?: boolean;
  compact?: boolean;
  className?: string;
};

/**
 * DS-003 §4/§6 — Living Logo (Fase 1).
 * Usa o PNG transparente único que já existe hoje (`/images/cec-family-logo.png`).
 * Aplica, respeitando `prefers-reduced-motion`:
 *   - entrada com fade + leve ampliação de 96% → 100%;
 *   - "respiração" discreta contínua da logo inteira;
 *   - brilho sutil e quente atrás da marca;
 *   - slogan institucional surgindo progressivamente (opcional).
 * Fase 2 (futura): logo vetorial em SVG com camadas independentes
 * (chama, asas, clave, partículas) — fora do escopo desta fase.
 */
export function LivingLogo({
  size = 96, animated = true, showSlogan = false, compact = false, className = "",
}: LivingLogoProps) {
  const [entered, setEntered] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    setReducedMotion(!!mq?.matches);
    // Pequeno atraso pra garantir que a transição de entrada seja percebida (não instantânea).
    const t = window.setTimeout(() => setEntered(true), 30);
    return () => window.clearTimeout(t);
  }, []);

  const breathing = animated && !reducedMotion;

  return (
    <div className={`flex flex-col items-center ${compact ? "gap-1.5" : "gap-3"} ${className}`}>
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        {breathing && (
          <div
            aria-hidden="true"
            className="animate-living-glow absolute rounded-full bg-[#FBBF24] blur-2xl"
            style={{ width: size * 0.85, height: size * 0.5, top: -size * 0.08 }}
          />
        )}
        <Image
          src="/images/cec-family-logo.png"
          alt="CEC FAMILY"
          width={size}
          height={size}
          priority
          className={[
            "relative h-full w-full object-contain transition-all duration-700 ease-out",
            entered ? "scale-100 opacity-100" : "scale-[0.96] opacity-0",
            breathing ? "animate-living-breathe" : "",
          ].join(" ")}
        />
      </div>

      {showSlogan && !compact && (
        <p
          className={`text-center text-sm font-semibold leading-snug text-[#0F172A] transition-opacity duration-700 ${entered ? "opacity-100" : "opacity-0"}`}
          style={{ transitionDelay: entered ? "250ms" : "0ms" }}
        >
          Conectando pessoas.<br />Fortalecendo a fé.<br />Desenvolvendo líderes.
        </p>
      )}
    </div>
  );
}
