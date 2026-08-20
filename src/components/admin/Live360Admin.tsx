"use client";

import { useMemo, useState } from "react";
import {
  Plus, Play, Square, Snowflake, Link2, QrCode, Music, Trash2, ChevronLeft, ChevronRight, Pencil, Check, Palette, History, Loader2, Monitor, ZoomIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useMyProfile, useLiveSessions, useLiveCurrent, useLiveLyrics, useLiveOnairLyric, useLiveSessionTheme, useLiveCommandLog } from "@/hooks/use-queries";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import {
  startLiveSession, createLiveControlToken, applyLiveCommand, freezeLiveSession,
  saveLiveLyric, deleteLiveLyric, setLiveSessionTheme,
} from "@/services/live360";
import type { LiveSession, LiveCurrentItem, LiveLyric, LiveLyricBlock, LiveLyricBlockType, LiveTheme } from "@/types/domain";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cec-painel.vercel.app";
const BLOCK_LABELS: Record<LiveLyricBlockType, string> = {
  verse: "Verso", chorus: "Refrão", bridge: "Ponte", ending: "Final",
};
const THEME_PRESETS: { label: string; theme: LiveTheme }[] = [
  { label: "Clássico (azul marinho)", theme: { bg: "#0f172a", text: "#ffffff", accent: "#d4af37", fontDisplay: "font-display" } },
  { label: "Escuro sutil", theme: { bg: "#111111", text: "#f5f5f5", accent: "#e8c96a", fontDisplay: "font-display" } },
  { label: "Claro", theme: { bg: "#ffffff", text: "#1a1a2e", accent: "#b45309", fontDisplay: "font-sans" } },
  { label: "Roxo", theme: { bg: "#2e1065", text: "#ffffff", accent: "#f0abfc", fontDisplay: "font-display" } },
  { label: "Verde igreja", theme: { bg: "#064e3b", text: "#fefce8", accent: "#facc15", fontDisplay: "font-display" } },
];

export function Live360Admin() {
  const { data: myProfile } = useMyProfile();
  const churchId = myProfile?.church_id ?? null;
  const { data: sessions = [] } = useLiveSessions(churchId);
  const [section, setSection] = useState<"sessoes" | "controle" | "repertorio">("sessoes");
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
          <Button variant={section === "repertorio" ? "default" : "outline"} onClick={() => setSection("repertorio")}>
            <Music className="mr-1 h-4 w-4" /> Repertório
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
      ) : section === "repertorio" ? (
        <Repertorio churchId={churchId} onError={setErr} onOk={setOk} />
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

// ── Repertório: cadastro de hinos com letra em blocos ──
function Repertorio({ churchId, onError, onOk }: { churchId: string | null; onError: (m: string) => void; onOk: (m: string) => void }) {
  const { data: lyrics = [] } = useLiveLyrics(churchId);
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<LiveLyric | "new" | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return lyrics;
    return lyrics.filter((l) => l.title.toLowerCase().includes(q) || (l.author ?? "").toLowerCase().includes(q));
  }, [lyrics, search]);

  async function handleDelete(id: string) {
    if (!confirm("Excluir este hino do repertório?")) return;
    onError(""); onOk("");
    try {
      await deleteLiveLyric(supabase, id);
      qc.invalidateQueries({ queryKey: ["live-lyrics"] });
      onOk("Hino excluído.");
    } catch (e: unknown) {
      onError(e instanceof Error ? e.message : "Não foi possível excluir o hino.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Repertório de Louvor</CardTitle>
        <CardDescription>Cadastre hinos e letras em blocos para projetar no datashow.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input placeholder="Buscar por título ou autor..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <Button onClick={() => setEditing("new")}>
            <Plus className="mr-1 h-4 w-4" /> Novo hino
          </Button>
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-muted">Nenhum hino cadastrado.</p>
        ) : (
          <ul className="space-y-2">
            {filtered.map((l) => (
              <li key={l.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium">{l.title}</p>
                  <p className="text-xs text-muted">
                    {l.author ?? "Autor desconhecido"} · {l.lyrics.length} bloco(s)
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditing(l)}>
                    <Pencil className="mr-1 h-4 w-4" /> Editar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(l.id)}>
                    <Trash2 className="mr-1 h-4 w-4" /> Excluir
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {editing && (
          <LyricEditor
            lyric={editing === "new" ? null : editing}
            churchId={churchId}
            onClose={() => setEditing(null)}
            onError={onError}
            onOk={onOk}
          />
        )}
      </CardContent>
    </Card>
  );
}

// ── Editor de hino (criar/editar blocos de letra) ──
function LyricEditor({
  lyric, churchId, onClose, onError, onOk,
}: {
  lyric: LiveLyric | null;
  churchId: string | null;
  onClose: () => void;
  onError: (m: string) => void;
  onOk: (m: string) => void;
}) {
  const qc = useQueryClient();
  const [title, setTitle] = useState(lyric?.title ?? "");
  const [author, setAuthor] = useState(lyric?.author ?? "");
  const [blocks, setBlocks] = useState<LiveLyricBlock[]>(lyric?.lyrics ?? []);
  const [saving, setSaving] = useState(false);

  function addBlock(type: LiveLyricBlockType = "verse") {
    setBlocks((b) => [...b, { type, lines: [""] }]);
  }
  function addLine(blockIdx: number) {
    setBlocks((b) => b.map((blk, bi) => bi !== blockIdx ? blk : { ...blk, lines: [...blk.lines, ""] }));
  }
  function updateLine(blockIdx: number, lineIdx: number, value: string) {
    setBlocks((b) => b.map((blk, bi) => bi !== blockIdx ? blk : {
      ...blk, lines: blk.lines.map((ln, li) => li !== lineIdx ? ln : value),
    }));
  }
  function removeLine(blockIdx: number, lineIdx: number) {
    setBlocks((b) => b.map((blk, bi) => bi !== blockIdx ? blk : {
      ...blk, lines: blk.lines.filter((_, li) => li !== lineIdx),
    }));
  }
  function setBlockType(blockIdx: number, type: LiveLyricBlockType) {
    setBlocks((b) => b.map((blk, bi) => bi !== blockIdx ? blk : { ...blk, type }));
  }
  function removeBlock(blockIdx: number) {
    setBlocks((b) => b.filter((_, bi) => bi !== blockIdx));
  }

  async function handleSave() {
    if (!churchId) { onError("Sem igreja vinculada ao seu perfil."); return; }
    if (!title.trim()) { onError("Informe o título do hino."); return; }
    const clean = blocks
      .map((blk) => ({ ...blk, lines: blk.lines.map((ln) => ln.trim()).filter(Boolean) }))
      .filter((blk) => blk.lines.length > 0);
    if (clean.length === 0) { onError("Adicione ao menos um bloco de letra."); return; }

    onError(""); onOk(""); setSaving(true);
    try {
      await saveLiveLyric(supabase, {
        id: lyric?.id,
        churchId,
        title,
        author: author.trim() || null,
        lyrics: clean,
      });
      qc.invalidateQueries({ queryKey: ["live-lyrics"] });
      onOk(lyric ? "Hino atualizado." : "Hino cadastrado.");
      onClose();
    } catch (e: unknown) {
      onError(e instanceof Error ? e.message : "Não foi possível salvar o hino.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 rounded-lg border border-gold/30 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Título</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título do hino" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Autor</label>
          <Input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Autor/compositor (opcional)" />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Blocos da letra</p>
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => addBlock("verse")}>+ Verso</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => addBlock("chorus")}>+ Refrão</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => addBlock("bridge")}>+ Ponte</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => addBlock("ending")}>+ Final</Button>
          </div>
        </div>

        {blocks.length === 0 && (
          <p className="text-xs text-muted">Nenhum bloco ainda. Use os botões acima para adicionar versos/refrões.</p>
        )}

        {blocks.map((blk, bi) => (
          <div key={bi} className="rounded-lg border bg-muted/30 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <select
                value={blk.type}
                onChange={(e) => setBlockType(bi, e.target.value as LiveLyricBlockType)}
                className="rounded-md border bg-background px-2 py-1 text-sm"
              >
                {(Object.keys(BLOCK_LABELS) as LiveLyricBlockType[]).map((t) => (
                  <option key={t} value={t}>{BLOCK_LABELS[t]}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => addLine(bi)}>+ Linha</Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => removeBlock(bi)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              {blk.lines.map((ln, li) => (
                <div key={li} className="flex items-center gap-2">
                  <Input value={ln} onChange={(e) => updateLine(bi, li, e.target.value)} placeholder={`Linha ${li + 1}`} />
                  {blk.lines.length > 1 && (
                    <Button type="button" size="sm" variant="ghost" onClick={() => removeLine(bi, li)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSave} disabled={saving}>
          <Check className="mr-1 h-4 w-4" /> {saving ? "Salvando..." : "Salvar hino"}
        </Button>
      </div>
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
  const [lyricIdx, setLyricIdx] = useState(0);

  const onairLyric = useLiveOnairLyric(session.id, current?.kind === "lyric");
  const onair = onairLyric.data ?? null;

  const blocks = onair?.lyrics ?? [];
  const slide = typeof current?.payload?.slide === "number" ? current.payload.slide : 0;
  const safeSlide = blocks.length > 0 ? Math.min(slide, blocks.length - 1) : 0;

  async function send(kind: LiveCurrentItem["kind"], cmd: string, refValue?: string, payload?: Record<string, unknown>) {
    onError(""); onOk(""); setApplying(true);
    try {
      await applyLiveCommand(supabase, {
        sessionId: session.id,
        cmd,
        kind,
        ref: refValue ?? null,
        payload,
        clientId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      });
      onOk("Comando enviado ao ar.");
      if (kind === "bible") setRef("");
    } catch (e: unknown) {
      onError(e instanceof Error ? e.message : "Não foi possível enviar o comando.");
    } finally {
      setApplying(false);
    }
  }

  async function goToSlide(next: number) {
    if (!onair) return;
    const target = Math.max(0, Math.min(next, blocks.length - 1));
    if (target === safeSlide) return;
    await send("lyric", "set_lyric", onair.id, { slide: target });
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
          <ThemePicker sessionId={session.id} onError={onError} onOk={onOk} />
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

          <LyricPicker
            session={session}
            currentLyricId={current?.kind === "lyric" ? (current.ref ?? null) : null}
            onSelect={(lyricId) => send("lyric", "set_lyric", lyricId, { slide: 0 })}
            disabled={applying}
          />

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

      {onair && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{onair.title}</CardTitle>
            <CardDescription>
              Estrofe {safeSlide + 1} de {blocks.length} · {BLOCK_LABELS[blocks[safeSlide]?.type] ?? ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 space-y-1 rounded-lg bg-muted/40 p-4 text-navy">
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
          </CardContent>
        </Card>
      )}

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

      <CommandLog sessionId={session.id} />
    </div>
  );
}

// ── Seletor de tema visual da projeção ──
function ThemePicker({ sessionId, onError, onOk }: { sessionId: string; onError: (m: string) => void; onOk: (m: string) => void }) {
  const { data: theme } = useLiveSessionTheme(sessionId);
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();

  async function apply(sel: LiveTheme) {
    onError(""); onOk(""); setSaving(true);
    try {
      await setLiveSessionTheme(supabase, sessionId, sel);
      qc.invalidateQueries({ queryKey: ["live-session-theme"] });
      onOk("Tema aplicado à projeção.");
    } catch (e: unknown) {
      onError(e instanceof Error ? e.message : "Não foi possível aplicar o tema.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Palette className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm font-medium text-muted-foreground">Tema:</span>
      {THEME_PRESETS.map((p) => (
        <button
          key={p.label}
          type="button"
          onClick={() => apply(p.theme)}
          disabled={saving}
          className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition ${theme?.bg === p.theme.bg && theme?.accent === p.theme.accent ? "border-gold bg-gold/20 font-semibold" : "border-border hover:bg-muted"}`}
        >
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: p.theme.bg }} />
          {p.label}
        </button>
      ))}
      <span className="ml-2 flex items-center gap-1 text-sm text-muted-foreground">
        <Monitor className="h-4 w-4" /> Projeção:
      </span>
      <button
        type="button"
        disabled={saving}
        onClick={() => apply({ ...(theme ?? THEME_PRESETS[0].theme), ratio: theme?.ratio === "16:9" ? "auto" : "16:9" })}
        className={`rounded-full border px-3 py-1 text-xs transition ${theme?.ratio === "16:9" ? "border-gold bg-gold/20 font-semibold" : "border-border hover:bg-muted"}`}
      >
        {theme?.ratio === "16:9" ? "16:9 (segundo monitor)" : "Automático (tela cheia)"}
      </button>
      <span className="ml-2 flex items-center gap-1 text-sm text-muted-foreground">
        <ZoomIn className="h-4 w-4" /> Escala:
      </span>
      {[0.75, 1, 1.25, 1.5].map((s) => (
        <button
          key={s}
          type="button"
          disabled={saving}
          onClick={() => apply({ ...(theme ?? THEME_PRESETS[0].theme), scale: s })}
          className={`rounded-full border px-3 py-1 text-xs transition ${(theme?.scale ?? 1) === s ? "border-gold bg-gold/20 font-semibold" : "border-border hover:bg-muted"}`}
        >
          {s * 100}%
        </button>
      ))}
    </div>
  );
}

// ── Histórico de comandos (auditoria) ──
function CommandLog({ sessionId }: { sessionId: string }) {
  const { data: log = [], isLoading } = useLiveCommandLog(sessionId);
  const [open, setOpen] = useState(false);

  if (log.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4" /> Histórico de comandos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading && <div className="flex items-center gap-2 text-xs text-muted"><Loader2 className="h-3 w-3 animate-spin" /> Carregando...</div>}
        {(open ? log : log.slice(0, 5)).map((e) => (
          <div key={e.id} className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-1.5 text-xs">
            <div className="flex items-center gap-2">
              <code className="rounded bg-background px-1.5 py-0.5 font-mono">{e.cmd}</code>
              <span className="text-muted-foreground">{e.operator_name}</span>
            </div>
            <span className="text-muted-foreground">{new Date(e.created_at).toLocaleString("pt-BR")}</span>
          </div>
        ))}
        {log.length > 5 && (
          <Button variant="ghost" size="sm" onClick={() => setOpen((o) => !o)}>
            {open ? "Mostrar menos" : `Mostrar todos (${log.length})`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// ── Seletor de música do repertório ──
function LyricPicker({
  session, currentLyricId, onSelect, disabled,
}: {
  session: LiveSession;
  currentLyricId: string | null;
  onSelect: (lyricId: string) => void;
  disabled: boolean;
}) {
  const { data: myProfile } = useMyProfile();
  const churchId = myProfile?.church_id ?? null;
  const { data: lyrics = [] } = useLiveLyrics(churchId);
  const [open, setOpen] = useState(false);

  if (lyrics.length === 0) {
    return (
      <p className="text-xs text-muted">
        Nenhum hino no repertório. Cadastre em <b>Live-360 → Repertório</b>.
      </p>
    );
  }

  const currentTitle = lyrics.find((l) => l.id === currentLyricId)?.title ?? "Selecionar música...";

  return (
    <div className="space-y-2">
      <Button type="button" variant="outline" className="w-full justify-between" onClick={() => setOpen((o) => !o)} disabled={disabled}>
        <span className="flex items-center gap-2"><Music className="h-4 w-4" /> {currentTitle}</span>
        <span className="text-xs text-muted">{open ? "▲" : "▼"}</span>
      </Button>
      {open && (
        <ul className="max-h-56 space-y-1 overflow-y-auto rounded-lg border bg-background p-2">
          {lyrics.map((l) => (
            <li key={l.id}>
              <button
                type="button"
                onClick={() => { onSelect(l.id); setOpen(false); }}
                className={`w-full rounded px-2 py-1.5 text-left text-sm hover:bg-muted ${l.id === currentLyricId ? "bg-gold/20 font-semibold" : ""}`}
              >
                {l.title}
                {l.author ? <span className="block text-xs text-muted">{l.author}</span> : null}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}