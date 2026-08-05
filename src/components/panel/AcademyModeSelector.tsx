"use client";
import { useState } from "react";
import { User, Users, Flame, School, Mic2, Headphones, Settings2, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { useEducationMode } from "@/hooks/use-queries";
import * as Ax from "@/services/accessibility";
import type { EducationMode } from "@/types/domain";

/**
 * CEC Academy Bloco 6 (ACA-B06-UI §8) — Modos Educacionais. Ajusta
 * o contexto de uso: sozinho, em família, no Life Group, em sala
 * de aula, no púlpito, ou só de ouvido (áudio). Persistido em
 * user_preferences.extra.education_mode — sem tabela nova.
 */
export const MODE_CONFIG: Record<EducationMode, { label: string; icon: typeof User; description: string }> = {
  individual: { label: "Individual", icon: User, description: "Estudo no seu próprio ritmo" },
  familia: { label: "Família", icon: Users, description: "Estudando junto com a família" },
  life_group: { label: "Life Group", icon: Flame, description: "Conteúdo usado numa reunião de célula" },
  sala_de_aula: { label: "Sala de Aula", icon: School, description: "Um professor conduzindo um grupo" },
  pulpito: { label: "Púlpito", icon: Mic2, description: "Apresentação num culto ou evento" },
  somente_audio: { label: "Somente Áudio", icon: Headphones, description: "Sem precisar olhar pra tela" },
};

export function AcademyModeBanner({ profileId, onOpenSelector }: { profileId: string | null; onOpenSelector: () => void }) {
  const { data: mode = "individual" } = useEducationMode(profileId);
  if (mode === "individual") return null; // não polui a tela quando está no padrão
  const cfg = MODE_CONFIG[mode];
  const Icon = cfg.icon;
  return (
    <button onClick={onOpenSelector} className="flex w-full items-center gap-2 rounded-lg border border-gold/40 bg-gold/10 px-3 py-2 text-left">
      <Icon className="h-4 w-4 shrink-0 text-gold" />
      <span className="text-xs font-semibold text-navy">Modo: {cfg.label}</span>
      <span className="ml-auto text-[10px] text-muted-foreground">Trocar</span>
    </button>
  );
}

export function AcademyModeSelectorButton({ profileId }: { profileId: string | null }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-navy">
        <Settings2 className="h-3.5 w-3.5" />Modo educacional
      </button>
      {open && <AcademyModeSelector profileId={profileId} onClose={() => setOpen(false)} />}
    </>
  );
}

export function AcademyModeSelector({ profileId, onClose }: { profileId: string | null; onClose: () => void }) {
  const qc = useQueryClient();
  const { data: current = "individual" } = useEducationMode(profileId);
  const [busy, setBusy] = useState(false);

  async function choose(mode: EducationMode) {
    if (!profileId) return;
    setBusy(true);
    try {
      await Ax.setEducationMode(supabase, profileId, mode);
      qc.invalidateQueries({ queryKey: ["education-mode", profileId] });
      onClose();
    } finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-card p-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <p className="font-display text-base text-navy">Modo educacional</p>
          <button onClick={onClose}><X className="h-4 w-4 text-muted-foreground" /></button>
        </div>
        <div className="space-y-1.5">
          {(Object.entries(MODE_CONFIG) as [EducationMode, typeof MODE_CONFIG[EducationMode]][]).map(([key, cfg]) => {
            const Icon = cfg.icon;
            const active = current === key;
            return (
              <button key={key} onClick={() => choose(key)} disabled={busy}
                className={`flex w-full items-center gap-2.5 rounded-lg border p-2.5 text-left transition ${active ? "border-gold bg-gold/10" : "border-border hover:border-gold/40"}`}>
                <Icon className={`h-4 w-4 shrink-0 ${active ? "text-gold" : "text-muted-foreground"}`} />
                <span>
                  <span className="block text-sm font-semibold text-navy">{cfg.label}</span>
                  <span className="block text-xs text-muted-foreground">{cfg.description}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
