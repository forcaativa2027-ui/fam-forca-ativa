"use client";

import { useState } from "react";
import { Plus, Play, Square, Snowflake, Link2, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useMyProfile, useLiveSessions, useLiveCurrent } from "@/hooks/use-queries";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import {
  startLiveSession, createLiveControlToken, applyLiveCommand, freezeLiveSession,
} from "@/services/live360";
import type { LiveSession, LiveCurrentItem } from "@/types/domain";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cec-painel.vercel.app";

export function Live360Admin() {
  const { data: myProfile } = useMyProfile();
  const churchId = myProfile?.church_id ?? null;
  const { data: sessions = [] } = useLiveSessions(churchId);
  const [section, setSection] = useState<"sessoes" | "controle">("sessoes");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [active, setActive] = useState<LiveSession | null>(null);
  const qc = useQueryClient();

  async function handleCreate() {
    if (!churchId) { setErr("Sem igreja vinculada ao seu perfil."); return; }
    setErr(""); setOk(""); setCreating(true);
    try {
      const s = await startLiveSession(supabase, churchId, newTitle || undefined);
      setNewTitle("");
      qc.invalidateQueries({ queryKey: ["live-sessions"] });
      setActive(s);
      setSection("controle");
      setOk("Sessão criada.");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Não foi possível criar a sessão.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-2">
          <Button variant={section === "sessoes" ? "default" : "outline"} onClick={() => setSection("sessoes")}>
            Sessões
          </Button>
          <Button variant={section === "controle" ? "default" : "outline"} onClick={() => setSection("controle")}>
            Controle
          </Button>
        </div>
      </div>

      {err && <p className="text-sm text-red-600">{err}</p>}
      {ok && <p className="text-sm text-emerald-600">{ok}</p>}

      {section === "sessoes" ? (
        <Card>
          <CardHeader>
            <CardTitle>Sessões de Live</CardTitle>
            <CardDescription>Crie uma sessão de projeção para a Bíblia e letras de hinos no datashow.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Título da sessão (ex.: Culto de Domingo)"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
              <Button onClick={handleCreate} disabled={creating || !churchId}>
                <Plus className="mr-1 h-4 w-4" /> Criar
              </Button>
            </div>
            {sessions.length === 0 ? (
              <p className="text-sm text-muted">Nenhuma sessão criada ainda.</p>
            ) : (
              <ul className="space-y-2">
                {sessions.map((s) => (
                  <li key={s.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-medium">{s.title}</p>
                      <p className="text-xs text-muted">
                        {new Date(s.created_at).toLocaleString("pt-BR")} · {s.status}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => { setActive(s); setSection("controle"); }}>
                      Controlar
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ) : (
        active && (
          <LiveControl
            session={active}
            onError={setErr}
            onOk={setOk}
          />
        )
      )}
    </div>
  );
}

function LiveControl({ session, onError, onOk }: { session: LiveSession; onError: (m: string) => void; onOk: (m: string) => void }) {
  const { data: current } = useLiveCurrent(session.id);
  const [ref, setRef] = useState("");
  const [applying, setApplying] = useState(false);
  const [frozen, setFrozen] = useState(session.status === "frozen");
  const [controlUrl, setControlUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function send(kind: LiveCurrentItem["kind"], cmd: string, refValue?: string) {
    onError(""); onOk(""); setApplying(true);
    try {
      await applyLiveCommand(supabase, {
        sessionId: session.id,
        cmd,
        kind,
        ref: refValue ?? null,
        clientId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      });
      onOk("Comando enviado ao ar.");
      setRef("");
    } catch (e: unknown) {
      onError(e instanceof Error ? e.message : "Não foi possível enviar o comando.");
    } finally {
      setApplying(false);
    }
  }

  async function toggleFreeze() {
    onError(""); onOk("");
    try {
      await freezeLiveSession(supabase, session.id, !frozen);
      setFrozen(!frozen);
      onOk(frozen ? "Tela descongelada." : "Tela congelada.");
    } catch (e: unknown) {
      onError(e instanceof Error ? e.message : "Não foi possível congelar a tela.");
    }
  }

  async function makeLink() {
    onError(""); onOk(""); setCopied(false);
    try {
      const res = await createLiveControlToken(supabase, session.id, "operator", 4);
      const url = `${BASE_URL}/live/control/${session.id}/${res.raw_token}`;
      setControlUrl(url);
      await navigator.clipboard.writeText(url);
      setCopied(true);
      onOk(`Link válido até ${new Date(res.expires_at).toLocaleString("pt-BR")}.`);
    } catch (e: unknown) {
      onError(e instanceof Error ? e.message : "Não foi possível gerar o token.");
    }
  }

  const projectUrl = `${BASE_URL}/live/${session.id}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(projectUrl)}`;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {session.title}
            {frozen && <Snowflake className="h-4 w-4 text-sky-500" />}
          </CardTitle>
          <CardDescription>
            No ar: <span className="font-medium">{current?.kind ?? "nada"}{current?.ref ? ` — ${current.ref}` : ""}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Referência bíblica (ex.: sl 23:1-6)"
              value={ref}
              onChange={(e) => setRef(e.target.value)}
            />
            <Button onClick={() => send("bible", "set_bible", ref)} disabled={applying || !ref.trim()}>
              <Play className="mr-1 h-4 w-4" /> Bíblia
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => send("blank", "blank")} disabled={applying}>
              <Square className="mr-1 h-4 w-4" /> Tela limpa
            </Button>
            <Button variant="outline" onClick={toggleFreeze}>
              <Snowflake className="mr-1 h-4 w-4" /> {frozen ? "Descongelar" : "Congelar"}
            </Button>
            <Button variant="outline" onClick={makeLink}>
              <Link2 className="mr-1 h-4 w-4" /> Link de controle
            </Button>
          </div>
          {copied && <p className="text-xs text-emerald-600">Link copiado.</p>}
          {controlUrl && (
            <p className="break-all rounded bg-muted p-2 font-mono text-xs">{controlUrl}</p>
          )}
          <p className="text-xs text-muted">
            Projeção: <span className="font-mono">{projectUrl}</span>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-4 w-4" /> QR Code de projeção
          </CardTitle>
          <CardDescription>Abra este QR no navegador conectado ao datashow.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-3">
          <img src={qrUrl} alt="QR de projeção" width={220} height={220} className="rounded-lg border" />
          <p className="text-sm text-muted">
            Controle com login/senha (admin) ou com o link/token gerado acima.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}