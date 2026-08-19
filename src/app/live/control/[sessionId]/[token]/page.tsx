"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Play, Square, Snowflake, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { validateLiveToken, applyLiveCommand, freezeLiveSession } from "@/services/live360";
import type { LiveTokenValidation } from "@/types/domain";

export default function LiveControlPage() {
  const params = useParams<{ sessionId: string; token: string }>();
  const sessionId = params?.sessionId ?? "";
  const token = params?.token ?? "";

  const [validation, setValidation] = useState<LiveTokenValidation | null>(null);
  const [checking, setChecking] = useState(true);
  const [err, setErr] = useState("");
  const [ref, setRef] = useState("");
  const [applying, setApplying] = useState(false);
  const [frozen, setFrozen] = useState(false);
  const [ok, setOk] = useState("");

  useEffect(() => {
    if (!sessionId || !token) { setChecking(false); setErr("Sessão ou token ausentes."); return; }
    validateLiveToken(supabase, sessionId, token)
      .then(setValidation)
      .catch(() => setErr("Não foi possível validar o token."))
      .finally(() => setChecking(false));
  }, [sessionId, token]);

  async function send(kind: "bible" | "blank", cmd: string, refValue?: string) {
    setErr(""); setOk(""); setApplying(true);
    try {
      await applyLiveCommand(supabase, {
        sessionId,
        cmd,
        kind,
        ref: refValue ?? null,
        token,
        clientId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      });
      setOk("Comando enviado ao ar.");
      setRef("");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Não foi possível enviar o comando.");
    } finally {
      setApplying(false);
    }
  }

  async function toggleFreeze() {
    setErr(""); setOk("");
    try {
      await freezeLiveSession(supabase, sessionId, !frozen);
      setFrozen(!frozen);
      setOk(frozen ? "Tela descongelada." : "Tela congelada.");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Não foi possível congelar.");
    }
  }

  if (checking) {
    return (
      <main className="grid min-h-screen place-items-center bg-navy text-white">
        <div className="flex items-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /> Validando acesso...</div>
      </main>
    );
  }

  if (!validation?.valid) {
    return (
      <main className="grid min-h-screen place-items-center bg-navy px-6 text-white">
        <div className="text-center">
          <p className="text-2xl font-bold">Acesso negado</p>
          <p className="mt-2 text-white/70">Token inválido ou expirado. Gere um novo link no painel Live-360.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-navy p-6 text-white">
      <div className="mx-auto max-w-lg space-y-4">
        <div className="rounded-2xl border border-gold/40 bg-background p-6 text-navy">
          <p className="text-xs font-bold uppercase tracking-wide text-gold">{validation.session_title}</p>
          <p className="mt-1 font-display text-xl font-bold">Controle do Live-360</p>
        </div>

        <div className="rounded-2xl border border-gold/40 bg-background p-6 text-navy">
          <label className="mb-1 block text-sm font-medium">Referência bíblica</label>
          <div className="flex gap-2">
            <Input
              placeholder="ex.: sl 23:1-6"
              value={ref}
              onChange={(e) => setRef(e.target.value)}
            />
            <Button onClick={() => send("bible", "set_bible", ref)} disabled={applying || !ref.trim()}>
              <Play className="mr-1 h-4 w-4" /> Bíblia
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-gold/40 bg-background p-6 text-navy">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => send("blank", "blank")} disabled={applying}>
              <Square className="mr-1 h-4 w-4" /> Tela limpa
            </Button>
            <Button variant="outline" onClick={toggleFreeze}>
              <Snowflake className="mr-1 h-4 w-4" /> {frozen ? "Descongelar" : "Congelar"}
            </Button>
          </div>
        </div>

        {err && <p className="text-sm text-red-400">{err}</p>}
        {ok && <p className="text-sm text-emerald-400">{ok}</p>}
      </div>
    </main>
  );
}