"use client";
import { useState } from "react";
import { Bell, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { registerRadioListener } from "@/services/radio";
import type { RadioProgram } from "@/types/domain";

export function RadioSubscribe({
  churchId,
  programs,
}: {
  churchId: string | null;
  programs: RadioProgram[];
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError("Preencha nome e e-mail.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await registerRadioListener(supabase, {
        church_id: churchId,
        name,
        email,
        program_ids: selected.size > 0 ? Array.from(selected) : undefined,
      });
      setDone(true);
    } catch {
      setError("Não foi possível registrar. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-xl border border-gold/30 bg-gold/5 p-5">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-gold" />
          <h3 className="font-display font-bold text-navy">Inscrição confirmada!</h3>
        </div>
        <p className="mt-2 text-sm text-muted">
          Avisaremos por e-mail quando um programa entrar no ar. Para deixar de receber, use o link
          de descadastro enviado no e-mail.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gold/30 p-5">
      <div className="flex items-center gap-2">
        <Bell className="h-5 w-5 text-gold" />
        <h3 className="font-display font-bold text-navy">Receba aviso quando entrar no ar</h3>
      </div>
      <p className="mt-1 text-sm text-muted">
        Deixe seu e-mail e avisaremos quando a programação começar.
      </p>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Seu nome"
          className="w-full rounded-lg border border-gold/30 bg-background px-3 py-2 text-sm text-navy outline-none focus:border-gold"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Seu e-mail"
          className="w-full rounded-lg border border-gold/30 bg-background px-3 py-2 text-sm text-navy outline-none focus:border-gold"
        />
        {programs.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Programas de interesse (opcional)
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {programs.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggle(p.id)}
                  className={`rounded-full border px-3 py-1 text-xs transition ${
                    selected.has(p.id)
                      ? "border-gold bg-gold text-navy font-semibold"
                      : "border-gold/30 text-navy hover:bg-gold/10"
                  }`}
                >
                  {p.title}
                </button>
              ))}
            </div>
          </div>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-gold py-2 text-sm font-semibold text-navy transition hover:bg-gold/90 disabled:opacity-60"
        >
          {submitting ? "Enviando..." : "Quero receber avisos"}
        </button>
      </form>
    </div>
  );
}
