"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Play, Square, Snowflake, Loader2, Music, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { validateLiveToken, applyLiveCommand, freezeLiveSession } from "@/services/live360";
import { useLiveLyricsByToken, useLiveOnairLyric, useLiveCurrent } from "@/hooks/use-queries";
import type { LiveTokenValidation, LiveLyricBlockType } from "@/types/domain";

const BLOCK_LABELS: Record<LiveLyricBlockType, string> = {
  verse: "Verso", chorus: "Refrão", bridge: "Ponte", ending: "Final",
};

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

  async function send(kind: "bible" | "lyric" | "blank", cmd: string, refValue?: string, payload?: Record<string, unknown>) {
    setErr(""); setOk(""); setApplying(true);
    try {
      await applyLiveCommand(supabase, {
        sessionId,
        cmd,
        kind,
        ref: refValue ?? null,
        payload,
        token,
        clientId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      });
      setOk("Comando enviado ao ar.");
      if (kind === "bible") setRef("");
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

        <TokenLyricControl
          sessionId={sessionId}
          token={token}
          applying={applying}
          onSend={send}
        />

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

// ── Controle de música/letra com token (sem login) ──
function TokenLyricControl({
  sessionId, token, applying, onSend,
}: {
  sessionId: string;
  token: string;
  applying: boolean;
  onSend: (kind: "lyric", cmd: string, refValue?: string, payload?: Record<string, unknown>) => Promise<void>;
}) {
  const { data: lyrics = [] } = useLiveLyricsByToken(sessionId, token);
  const { data: current } = useLiveCurrent(sessionId);
  const onairLyric = useLiveOnairLyric(sessionId, current?.kind === "lyric");
  const [open, setOpen] = useState(false);

  const onair = onairLyric.data ?? null;
  const blocks = onair?.lyrics ?? [];
  const slide = typeof current?.payload?.slide === "number" ? current.payload.slide : 0;
  const safeSlide = blocks.length > 0 ? Math.min(slide, blocks.length - 1) : 0;

  async function goToSlide(next: number) {
    if (!onair) return;
    const target = Math.max(0, Math.min(next, blocks.length - 1));
    if (target === safeSlide) return;
    await onSend("lyric", "set_lyric", onair.id, { slide: target });
  }

  if (lyrics.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-gold/40 bg-background p-6 text-navy">
      <label className="mb-1 block text-sm font-medium">Música do repertório</label>
      <Button type="button" variant="outline" className="w-full justify-between" onClick={() => setOpen((o) => !o)} disabled={applying}>
        <span className="flex items-center gap-2">
          <Music className="h-4 w-4" />
          {onair?.title ?? "Selecionar música..."}
        </span>
        <span className="text-xs text-muted">{open ? "▲" : "▼"}</span>
      </Button>
      {open && (
        <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto rounded-lg border p-2">
          {lyrics.map((l) => (
            <li key={l.id}>
              <button
                type="button"
                onClick={() => { onSend("lyric", "set_lyric", l.id, { slide: 0 }); setOpen(false); }}
                className={`w-full rounded px-2 py-1.5 text-left text-sm hover:bg-muted ${l.id === onair?.id ? "bg-gold/20 font-semibold" : ""}`}
              >
                {l.title}
                {l.author ? <span className="block text-xs text-muted">{l.author}</span> : null}
              </button>
            </li>
          ))}
        </ul>
      )}

      {onair && (
        <div className="mt-4">
          <p className="mb-1 text-sm text-muted">
            Estrofe {safeSlide + 1} de {blocks.length} · {BLOCK_LABELS[blocks[safeSlide]?.type] ?? ""}
          </p>
          <div className="mb-3 space-y-1 rounded-lg bg-muted/40 p-4">
            {blocks[safeSlide]?.lines.map((ln, li) => (
              <p key={li} className="text-lg leading-relaxed">{ln}</p>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => goToSlide(safeSlide - 1)} disabled={safeSlide === 0 || applying}>
              <ChevronLeft className="mr-1 h-4 w-4" /> Anterior
            </Button>
            <span className="text-sm text-muted">
              {blocks.map((b, bi) => (
                <button
                  key={bi}
                  onClick={() => goToSlide(bi)}
                  disabled={applying}
                  className={`mx-0.5 h-6 w-6 rounded-full text-xs font-bold transition ${bi === safeSlide ? "bg-gold text-navy" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}
                >
                  {bi + 1}
                </button>
              ))}
            </span>
            <Button variant="outline" size="sm" onClick={() => goToSlide(safeSlide + 1)} disabled={safeSlide === blocks.length - 1 || applying}>
              Próxima <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}