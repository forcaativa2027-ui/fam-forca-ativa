import type { AccessibilityProfile } from "@/types/domain";

/**
 * CT-018 §7-A — Ícones personalizados oficiais dos perfis de experiência.
 * Vetorizados a partir dos SVGs entregues no caderno técnico. Cores
 * originais preservadas (nunca usar versão monocromática/cinza).
 */

function IconShell({ children, size }: { children: React.ReactNode; size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 128 128"
      role="img"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

/** Experiência Padrão — smartphone azul, estrela dourada, brilhos. */
export function PadraoProfileIcon({ size = 64 }: { size?: number }) {
  return (
    <IconShell size={size}>
      <defs>
        <linearGradient id="ct018-g-padrao" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#60A5FA" />
          <stop offset="1" stopColor="#2563EB" />
        </linearGradient>
      </defs>
      <rect width="128" height="128" rx="28" fill="#EFF6FF" />
      <rect x="43" y="28" width="42" height="70" rx="10" fill="url(#ct018-g-padrao)" />
      <rect x="49" y="36" width="30" height="48" rx="5" fill="#FFFFFF" opacity=".95" />
      <circle cx="64" cy="91" r="3" fill="#DBEAFE" />
      <path d="M28 35l3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7zm72 14l2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5z" fill="#F59E0B" />
      <path d="M64 43l5 10 11 2-8 8 2 11-10-5-10 5 2-11-8-8 11-2 5-10z" fill="#FBBF24" />
    </IconShell>
  );
}

/** Perfil Confortável — duas pessoas acolhidas por um coração verde. */
export function ConfortavelProfileIcon({ size = 64 }: { size?: number }) {
  return (
    <IconShell size={size}>
      <defs>
        <linearGradient id="ct018-g-confortavel" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#4ADE80" />
          <stop offset="1" stopColor="#16A34A" />
        </linearGradient>
      </defs>
      <rect width="128" height="128" rx="28" fill="#F0FDF4" />
      <path d="M64 105S25 82 25 52c0-14 10-24 24-24 8 0 13 4 15 9 3-5 8-9 16-9 14 0 24 10 24 24 0 30-40 53-40 53z" fill="url(#ct018-g-confortavel)" />
      <circle cx="50" cy="53" r="10" fill="#FDE68A" />
      <circle cx="78" cy="53" r="10" fill="#FDE68A" />
      <path d="M35 83c2-14 9-21 15-21s13 7 15 21M63 83c2-14 9-21 15-21s13 7 15 21" fill="none" stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" />
    </IconShell>
  );
}

/** Perfil Baixa Visão — olho com lente de aumento em tons dourados. */
export function BaixaVisaoProfileIcon({ size = 64 }: { size?: number }) {
  return (
    <IconShell size={size}>
      <defs>
        <linearGradient id="ct018-g-baixavisao" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#FCD34D" />
          <stop offset="1" stopColor="#D97706" />
        </linearGradient>
      </defs>
      <rect width="128" height="128" rx="28" fill="#FFFBEB" />
      <path d="M18 63s17-28 46-28 46 28 46 28-17 28-46 28S18 63 18 63z" fill="#FFFFFF" stroke="#D97706" strokeWidth="7" />
      <circle cx="64" cy="63" r="17" fill="url(#ct018-g-baixavisao)" />
      <circle cx="64" cy="63" r="7" fill="#78350F" />
      <circle cx="86" cy="86" r="15" fill="none" stroke="#92400E" strokeWidth="7" />
      <path d="M97 97l14 14" stroke="#92400E" strokeWidth="8" strokeLinecap="round" />
    </IconShell>
  );
}

/** Perfil Simplificado — foguete roxo com poucos elementos. */
export function SimplificadoProfileIcon({ size = 64 }: { size?: number }) {
  return (
    <IconShell size={size}>
      <defs>
        <linearGradient id="ct018-g-simplificado" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#A78BFA" />
          <stop offset="1" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
      <rect width="128" height="128" rx="28" fill="#F5F3FF" />
      <path d="M74 22c18 4 29 15 32 33-8 16-19 27-35 35L48 67c8-17 16-30 26-45z" fill="url(#ct018-g-simplificado)" />
      <circle cx="80" cy="48" r="9" fill="#FFFFFF" />
      <path d="M50 70l-17 3 10 10 3 17 15-18-11-12z" fill="#8B5CF6" />
      <path d="M39 89l-12 12m20-6l-8 15" stroke="#F59E0B" strokeWidth="7" strokeLinecap="round" />
      <path d="M22 30h22M18 43h16M91 96h18" stroke="#C4B5FD" strokeWidth="6" strokeLinecap="round" />
    </IconShell>
  );
}

/**
 * Paleta funcional por perfil (CT-018 §7 e §14). Usada nos cartões do
 * assistente de boas-vindas — fundo suave, borda, texto e cor sólida.
 * Perfis técnicos (smartphone/tablet/desktop) reaproveitam o visual
 * "Padrão", já que não são oferecidos nesta tela.
 */
export const WELCOME_PROFILE_STYLE: Record<
  AccessibilityProfile,
  { solid: string; soft: string; border: string; text: string; Icon: (p: { size?: number }) => React.ReactElement }
> = {
  padrao: { solid: "#2563EB", soft: "#EFF6FF", border: "#93C5FD", text: "#1E3A8A", Icon: PadraoProfileIcon },
  idoso: { solid: "#16A34A", soft: "#F0FDF4", border: "#86EFAC", text: "#14532D", Icon: ConfortavelProfileIcon },
  baixa_visao: { solid: "#D97706", soft: "#FFFBEB", border: "#FCD34D", text: "#78350F", Icon: BaixaVisaoProfileIcon },
  simplificado: { solid: "#7C3AED", soft: "#F5F3FF", border: "#C4B5FD", text: "#4C1D95", Icon: SimplificadoProfileIcon },
  smartphone: { solid: "#2563EB", soft: "#EFF6FF", border: "#93C5FD", text: "#1E3A8A", Icon: PadraoProfileIcon },
  tablet: { solid: "#2563EB", soft: "#EFF6FF", border: "#93C5FD", text: "#1E3A8A", Icon: PadraoProfileIcon },
  desktop: { solid: "#2563EB", soft: "#EFF6FF", border: "#93C5FD", text: "#1E3A8A", Icon: PadraoProfileIcon },
};
