"use client";
import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { sermonSchema, eventSchema, type SermonInput, type EventInput } from "@/schemas";
import {
  useMyProfile, useSermons, useEvents, useAuditLogs,
  useDistricts, useAreas, useSectors, useCells,
} from "@/hooks/use-queries";
import { supabase } from "@/lib/supabase/client";
import { youtubeThumb } from "@/services/content";
import { logAudit } from "@/services/audit";

export default function AdminPanel() {
  const { data: me, isLoading } = useMyProfile();
  const isAdmin = me && ["apostolo","pastor"].includes(me.role);

  if (isLoading) return <main className="grid h-screen place-items-center text-muted">Carregando…</main>;
  if (!isAdmin) return (
    <Shell>
      <Card className="mx-auto max-w-md text-center">
        <CardContent className="pt-8 pb-8">
          <h2 className="font-display text-xl text-navy">Acesso restrito</h2>
          <p className="mt-2 text-sm text-muted">O painel administrativo é exclusivo para liderança apostólica (apóstolo ou pastor).</p>
          <Button asChild variant="link" className="mt-4"><Link href="/painel">← Voltar ao painel</Link></Button>
        </CardContent>
      </Card>
    </Shell>
  );

  return (
    <Shell>
      <Tabs defaultValue="sermons">
        <div className="overflow-x-auto">
          <TabsList className="mb-6 min-w-max">
            <TabsTrigger value="sermons">Pregações</TabsTrigger>
            <TabsTrigger value="events">Agenda</TabsTrigger>
            <TabsTrigger value="mda">Estrutura MDA</TabsTrigger>
            <TabsTrigger value="audit">Auditoria</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="sermons"><SermonsAdmin /></TabsContent>
        <TabsContent value="events"><EventsAdmin /></TabsContent>
        <TabsContent value="mda"><MdaStructure /></TabsContent>
        <TabsContent value="audit"><AuditView /></TabsContent>
      </Tabs>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b-[3px] border-gold bg-navy">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <span className="text-gold">✦</span><span className="font-display text-lg font-bold">CEC FAMILY</span>
            <span className="ml-2 border-l border-white/20 pl-3 text-xs font-semibold text-white/70">Administração</span>
          </div>
          <Button asChild variant="outline" size="sm" className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white">
            <Link href="/painel"><ArrowLeft className="mr-1 h-3.5 w-3.5" /> Painel</Link>
          </Button>
        </div>
      </header>
      <main className="container py-8">{children}</main>
    </div>
  );
}

function SermonsAdmin() {
  const { data: sermons = [] } = useSermons();
  const qc = useQueryClient();
  const [err, setErr] = useState("");
  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } =
    useForm<SermonInput>({ resolver: zodResolver(sermonSchema), defaultValues: { is_featured: false } });
  const urlWatch = watch("youtube_url");

  async function onSubmit(v: SermonInput) {
    setErr("");
    const { data, error } = await supabase.from("sermons").insert({
      ...v, thumbnail_url: youtubeThumb(v.youtube_url),
    }).select().single();
    if (error) { setErr(error.message); return; }
    await logAudit(supabase, "insert", "sermons", data.id, { title: v.title });
    reset();
    qc.invalidateQueries({ queryKey: ["sermons"] });
    qc.invalidateQueries({ queryKey: ["public-sermons"] });
  }
  async function remove(id: string, title: string) {
    if (!confirm("Remover esta pregação?")) return;
    const { error } = await supabase.from("sermons").delete().eq("id", id);
    if (!error) {
      await logAudit(supabase, "delete", "sermons", id, { title });
      qc.invalidateQueries({ queryKey: ["sermons"] });
      qc.invalidateQueries({ queryKey: ["public-sermons"] });
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Adicionar pregação (YouTube)</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <Field label="Título" error={errors.title?.message}><Input {...register("title")} placeholder="Ex: O Bezerro de Ouro" /></Field>
            <Field label="Link do YouTube" error={errors.youtube_url?.message}><Input {...register("youtube_url")} placeholder="https://youtube.com/watch?v=..." /></Field>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Referência"><Input {...register("reference")} placeholder="Ex 32:1-14" /></Field>
              <Field label="Pregador"><Input {...register("speaker")} placeholder="Pra. Anne" /></Field>
              <Field label="Categoria"><Input {...register("category")} placeholder="Série" /></Field>
            </div>
            {urlWatch && youtubeThumb(urlWatch) && <img src={youtubeThumb(urlWatch)!} alt="" className="h-24 rounded-md border" />}
            {err && <p className="text-sm text-destructive">{err}</p>}
            <Button type="submit" disabled={isSubmitting} className="gap-2"><Plus className="h-4 w-4" /> Adicionar pregação</Button>
          </form>
        </CardContent>
      </Card>

      <h3 className="font-display text-lg text-navy">Pregações publicadas ({sermons.length})</h3>
      <div className="space-y-3">
        {sermons.map((s) => (
          <div key={s.id} className="flex items-center gap-3 rounded-xl border bg-card p-3">
            <img src={s.thumbnail_url || youtubeThumb(s.youtube_url) || ""} alt="" className="h-14 w-24 rounded object-cover" />
            <div className="flex-1">
              <b className="text-navy">{s.title}</b>
              <p className="text-xs text-muted">{[s.reference, s.speaker, s.category].filter(Boolean).join(" · ")}</p>
            </div>
            <Button asChild variant="outline" size="sm"><a href={s.youtube_url} target="_blank" rel="noreferrer">Abrir</a></Button>
            <Button onClick={() => remove(s.id, s.title)} variant="destructive" size="sm"><Trash2 className="h-3.5 w-3.5" /></Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function EventsAdmin() {
  const { data: events = [] } = useEvents();
  const qc = useQueryClient();
  const [err, setErr] = useState("");
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<EventInput>({ resolver: zodResolver(eventSchema), defaultValues: { status: "abertas" } });

  async function onSubmit(v: EventInput) {
    setErr("");
    const { data, error } = await supabase.from("events").insert({
      title: v.title, starts_at: new Date(v.starts_at).toISOString(),
      location: v.location || null, status: v.status,
      registration_url: v.registration_url || null,
    }).select().single();
    if (error) { setErr(error.message); return; }
    await logAudit(supabase, "insert", "events", data.id, { title: v.title });
    reset();
    qc.invalidateQueries({ queryKey: ["events"] });
    qc.invalidateQueries({ queryKey: ["public-events"] });
  }
  async function remove(id: string, title: string) {
    if (!confirm("Remover este evento?")) return;
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (!error) {
      await logAudit(supabase, "delete", "events", id, { title });
      qc.invalidateQueries({ queryKey: ["events"] });
      qc.invalidateQueries({ queryKey: ["public-events"] });
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Adicionar evento</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <Field label="Título" error={errors.title?.message}><Input {...register("title")} placeholder="Ex: Curso de Noivos" /></Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Data e hora" error={errors.starts_at?.message}><Input type="datetime-local" {...register("starts_at")} /></Field>
              <Field label="Local"><Input {...register("location")} placeholder="Templo Sede" /></Field>
            </div>
            <Field label="Status">
              <select {...register("status")} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                <option value="abertas">Inscrições abertas</option>
                <option value="encerradas">Encerradas</option>
                <option value="esgotado">Esgotado</option>
                <option value="em_breve">Em breve</option>
              </select>
            </Field>
            {err && <p className="text-sm text-destructive">{err}</p>}
            <Button type="submit" disabled={isSubmitting} className="gap-2"><Plus className="h-4 w-4" /> Adicionar evento</Button>
          </form>
        </CardContent>
      </Card>

      <h3 className="font-display text-lg text-navy">Próximos eventos ({events.length})</h3>
      <div className="space-y-3">
        {events.map((ev) => (
          <div key={ev.id} className="flex items-center gap-3 rounded-xl border bg-card p-3">
            <div className="flex-1">
              <b className="text-navy">{ev.title}</b>
              <p className="text-xs text-muted">{new Date(ev.starts_at).toLocaleString("pt-BR")}{ev.location ? ` · ${ev.location}` : ""}</p>
            </div>
            <span className="rounded-full border border-gold px-2 py-1 text-[11px] font-bold text-gold">{ev.status}</span>
            <Button onClick={() => remove(ev.id, ev.title)} variant="destructive" size="sm"><Trash2 className="h-3.5 w-3.5" /></Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function MdaStructure() {
  const { data: districts = [] } = useDistricts();
  const { data: areas = [] } = useAreas();
  const { data: sectors = [] } = useSectors();
  const { data: cells = [] } = useCells();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Estrutura MDA (mínimo 3 por nível)</CardTitle>
          <CardDescription>Igreja → Distrito → Área → Setor → Célula. Multiplicação registrada via "mãe".</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-4">
            <MdaCount label="Distritos" value={districts.length} />
            <MdaCount label="Áreas" value={areas.length} />
            <MdaCount label="Setores" value={sectors.length} />
            <MdaCount label="Células" value={cells.length} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Hierarquia</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {districts.length === 0 && <p className="text-sm italic text-muted">Nenhum distrito cadastrado.</p>}
          {districts.map((d) => {
            const dAreas = areas.filter((a) => a.district_id === d.id);
            return (
              <div key={d.id} className="rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <b className="text-navy">{d.name}</b>
                  <span className="text-xs text-muted">{dAreas.length} área(s)</span>
                </div>
                <ul className="mt-2 space-y-1 pl-4 text-sm text-muted">
                  {dAreas.map((a) => {
                    const aSectors = sectors.filter((s) => s.area_id === a.id);
                    return (
                      <li key={a.id}>
                        <b className="text-navy-600">{a.name}</b> — {aSectors.length} setor(es)
                        <ul className="ml-4 mt-1 list-disc text-xs">
                          {aSectors.map((s) => {
                            const sCells = cells.filter((c) => c.sector_id === s.id);
                            return <li key={s.id}>{s.name}: {sCells.length} célula(s)</li>;
                          })}
                        </ul>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

function AuditView() {
  const { data: logs = [] } = useAuditLogs();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Logs de auditoria</CardTitle>
        <CardDescription>Ações registradas no sistema (últimos 50 eventos).</CardDescription>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-sm italic text-muted">Nenhum log registrado ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-muted">
                  <th className="p-2">Quando</th><th className="p-2">Quem</th><th className="p-2">Ação</th><th className="p-2">Entidade</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} className="border-b">
                    <td className="p-2 text-xs text-muted">{new Date(l.created_at).toLocaleString("pt-BR")}</td>
                    <td className="p-2">{l.actor_email ?? "—"}</td>
                    <td className="p-2"><span className="rounded bg-navy-50 px-2 py-0.5 text-xs font-bold text-navy">{l.action}</span></td>
                    <td className="p-2 text-navy">{l.entity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>{children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
function MdaCount({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-card p-4 text-center">
      <p className="font-display text-2xl font-semibold text-gold">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
