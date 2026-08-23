"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { eventSchema, type EventInput } from "@/schemas";
import { useEvents, useChurches } from "@/hooks/use-queries";
import { supabase } from "@/lib/supabase/client";
import { logAudit } from "@/services/audit";
import { Field } from "./PanelHelpers";

export function EventsAdmin() {
  const { data: events = [] } = useEvents();
  const { data: churchesList = [] } = useChurches();
  const qc = useQueryClient();
  const [err, setErr] = useState("");
  const [churchId, setChurchId] = useState<string>("");
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<EventInput>({ resolver: zodResolver(eventSchema), defaultValues: { status: "abertas", event_type: "outro" } });

  async function onSubmit(v: EventInput) {
    setErr("");
    const { data, error } = await supabase.from("events").insert({
      title: v.title, starts_at: new Date(v.starts_at).toISOString(),
      location: v.location || null, status: v.status, event_type: v.event_type,
      registration_url: v.registration_url || null,
      church_id: churchId || null,
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
            <Field label="Para qual comunidade?">
              <select value={churchId} onChange={(e) => setChurchId(e.target.value)}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                <option value="">— Global (todas as comunidades) —</option>
                {churchesList.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Título" error={errors.title?.message}><Input {...register("title")} placeholder="Ex: Curso de Noivos" /></Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Data e hora" error={errors.starts_at?.message}><Input type="datetime-local" {...register("starts_at")} /></Field>
              <Field label="Local"><Input {...register("location")} placeholder="Templo Sede" /></Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Tipo">
                <select {...register("event_type")} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                  <option value="culto">Culto</option>
                  <option value="congresso">Congresso</option>
                  <option value="conferencia">Conferência</option>
                  <option value="encontro">Encontro</option>
                  <option value="ebd">Escola Bíblica</option>
                  <option value="outro">Outro</option>
                </select>
              </Field>
              <Field label="Status">
                <select {...register("status")} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                  <option value="abertas">Inscrições abertas</option>
                  <option value="encerradas">Encerradas</option>
                  <option value="esgotado">Esgotado</option>
                  <option value="em_breve">Em breve</option>
                </select>
              </Field>
            </div>
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
