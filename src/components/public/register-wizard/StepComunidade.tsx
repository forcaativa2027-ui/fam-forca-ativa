"use client";
import { useState } from "react";
import { Check } from "lucide-react";
import { NavButtons } from "./RegisterWizardHelpers";
import type { RegisterState, UpdateFn } from "./RegisterWizardTypes";

// ============================================================
// ETAPA 6 — Região de atendimento e grupo de apoio FAM
// ============================================================
export function StepComunidade({ s, update, churches, cells, onBack, onNext }: {
  s: RegisterState;
  update: UpdateFn;
  churches: { id: string; name: string; type: string; city: string | null; state: string | null }[];
  cells: { id: string; name: string; church_id: string | null; state: string | null; city: string | null; neighborhood: string | null; meeting_weekday: string | null; meeting_time: string | null; is_active: boolean }[];
  onBack: () => void; onNext: () => void;
}) {
  const [err, setErr] = useState("");

  function next() {
    if (!s.community_id) { setErr("Selecione uma região de atendimento"); return; }
    onNext();
  }

  const lgsAll = cells.filter((c) => c.is_active && c.church_id === s.community_id);
  const lgsSameCity   = s.city  ? lgsAll.filter((c) => c.city  && c.city.toLowerCase()  === s.city.toLowerCase())   : [];
  const lgsSameState  = s.state ? lgsAll.filter((c) => c.state && c.state.toUpperCase() === s.state.toUpperCase() && !lgsSameCity.find(x => x.id === c.id)) : [];
  const lgsOthers     = lgsAll.filter((c) => !lgsSameCity.find(x => x.id === c.id) && !lgsSameState.find(x => x.id === c.id));

  const WEEKDAYS: Record<string, string> = {
    domingo: "Dom", segunda: "Seg", terca: "Ter", quarta: "Qua",
    quinta: "Qui", sexta: "Sex", sabado: "Sáb",
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-2xl font-bold text-navy">Região de atendimento mais próxima</h2>
        <p className="text-base text-muted">Onde você gostaria de receber informações e apoio da FAM</p>
      </div>

      <div className="space-y-2">
        {churches.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-gold/40 bg-gold/5 p-4 text-sm text-muted">
            <p className="font-semibold text-navy">Nenhuma região de atendimento está disponível no momento.</p>
            <p className="mt-1">A equipe FAM precisa ativar uma região antes que o cadastro possa continuar. Atualize a página após a configuração ou fale com a equipe de atendimento.</p>
          </div>
        ) : churches.map((c) => {
          const selected = s.community_id === c.id;
          return (
            <button key={c.id} type="button"
              onClick={() => {
                if (s.community_id !== c.id) update("life_group_id", "");
                update("community_id", c.id); setErr("");
              }}
              className={`flex w-full items-start gap-3 rounded-xl border-2 p-4 text-left transition ${selected ? "border-gold bg-gold/5" : "border-border bg-card hover:border-navy/30"}`}>
              <div className={`mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 ${selected ? "border-gold bg-gold" : "border-border"}`}>
                {selected && <Check className="h-4 w-4 text-navy" />}
              </div>
              <div>
                <b className="text-navy">{c.name}</b>
                {(c.city || c.state) && <p className="text-xs text-muted">{[c.city, c.state].filter(Boolean).join(", ")}</p>}
              </div>
            </button>
          );
        })}
      </div>

      {s.community_id && lgsAll.length > 0 && (
        <div className="rounded-xl border-2 border-dashed border-gold/40 bg-gold/5 p-4">
          <h3 className="font-display text-base text-navy">Encontre um grupo de apoio ou projeto FAM</h3>
          <p className="text-xs text-muted">Opcional — você pode escolher agora ou continuar sem definir um grupo</p>

          {lgsSameCity.length > 0 && (
            <LgGroup label={`Em ${s.city}`} cells={lgsSameCity} selected={s.life_group_id} onSelect={(id) => update("life_group_id", id)} weekdays={WEEKDAYS} />
          )}
          {lgsSameState.length > 0 && (
            <LgGroup label={s.state ? `Em outras cidades de ${s.state}` : "Outras"} cells={lgsSameState} selected={s.life_group_id} onSelect={(id) => update("life_group_id", id)} weekdays={WEEKDAYS} />
          )}
          {lgsOthers.length > 0 && lgsSameCity.length === 0 && lgsSameState.length === 0 && (
            <LgGroup label="Todos os grupos e projetos" cells={lgsOthers} selected={s.life_group_id} onSelect={(id) => update("life_group_id", id)} weekdays={WEEKDAYS} />
          )}

          <button type="button" onClick={() => update("life_group_id", "")}
            className={`mt-3 w-full rounded-lg border-2 p-3 text-left text-sm transition ${!s.life_group_id ? "border-gold bg-card" : "border-border bg-card/50 hover:border-navy/30"}`}>
            <b className="text-navy">Não sei / preciso de ajuda</b>
            <p className="text-xs text-muted">A equipe FAM poderá orientar você sobre a melhor opção</p>
          </button>
        </div>
      )}

      {err && <p className="text-xs text-destructive">{err}</p>}
      <NavButtons onBack={onBack} onNext={next} />
    </div>
  );
}

function LgGroup({ label, cells, selected, onSelect, weekdays }: {
  label: string;
  cells: { id: string; name: string; neighborhood: string | null; city: string | null; meeting_weekday: string | null; meeting_time: string | null }[];
  selected: string;
  onSelect: (id: string) => void;
  weekdays: Record<string, string>;
}) {
  return (
    <div className="mt-3">
      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-gold">{label}</p>
      <div className="space-y-1.5">
        {cells.map((c) => {
          const isSelected = selected === c.id;
          return (
            <button key={c.id} type="button" onClick={() => onSelect(c.id)}
              className={`flex w-full items-start gap-3 rounded-lg border-2 p-2.5 text-left transition ${isSelected ? "border-gold bg-card" : "border-border bg-card/50 hover:border-navy/30"}`}>
              <div className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 ${isSelected ? "border-gold bg-gold" : "border-border"}`}>
                {isSelected && <Check className="h-3 w-3 text-navy" />}
              </div>
              <div className="min-w-0 flex-1">
                <b className="block text-sm text-navy">{c.name}</b>
                <p className="text-[11px] text-muted">
                  {[c.neighborhood, c.city].filter(Boolean).join(", ")}
                  {c.meeting_weekday && c.meeting_time && ` · ${weekdays[c.meeting_weekday] ?? c.meeting_weekday} às ${c.meeting_time.slice(0,5)}`}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
