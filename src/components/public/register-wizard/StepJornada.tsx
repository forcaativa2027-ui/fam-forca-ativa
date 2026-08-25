"use client";
import { BookHeart, UsersRound } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Field, NavButtons, YesNoIcon } from "./RegisterWizardHelpers";
import type { RegisterState, UpdateFn } from "./RegisterWizardTypes";

// ============================================================
// ETAPA 8 — Jornada, contexto e participação — opcionais
// ============================================================
export function StepJornada({ s, update, onBack, onNext }: { s: RegisterState; update: UpdateFn; onBack: () => void; onNext: () => void }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-2xl font-bold text-navy">Sua jornada</h2>
        <p className="text-base text-muted">Tudo aqui é opcional — pode deixar em branco e continuar</p>
      </div>

      <Field label="O que trouxe você até a FAM? (opcional)">
        <Textarea value={s.seeking_reason} onChange={(e) => update("seeking_reason", e.target.value)} rows={2} placeholder="Conte um pouco, se quiser..." />
      </Field>

      <Field label="Existe alguma necessidade ou objetivo que gostaria de compartilhar? (opcional)">
        <Textarea value={s.life_before_church} onChange={(e) => update("life_before_church", e.target.value)} rows={2} placeholder="Compartilhe somente o que se sentir segura para informar..." />
      </Field>

      <Field label="Quer compartilhar uma experiência ou habilidade? (opcional)">
        <div className="mb-1.5 flex items-center gap-1.5 text-xs text-gold"><BookHeart className="h-3.5 w-3.5" />Essas informações ajudam a FAM a identificar formas de participação</div>
        <Textarea value={s.testimony} onChange={(e) => update("testimony", e.target.value)} rows={3} placeholder="Experiências, conhecimentos ou áreas em que gostaria de contribuir..." />
      </Field>

      <Field label="Você já participa de algum grupo, projeto ou organização social?">
        <YesNoIcon value={s.belongs_to_group} onChange={(v) => update("belongs_to_group", v)} icon={<UsersRound className="h-7 w-7" />} />
      </Field>
      {s.belongs_to_group && (
        <Field label="Qual grupo, projeto ou organização?"><Input className="h-12 text-base" value={s.group_name} onChange={(e) => update("group_name", e.target.value)} placeholder="Nome do grupo ou organização" /></Field>
      )}

      <NavButtons onBack={onBack} onNext={onNext} />
    </div>
  );
}
