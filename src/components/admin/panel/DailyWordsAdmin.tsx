"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/shared/DatePicker";
import { dailyWordSchema, type DailyWordInput } from "@/schemas";
import { useDailyWords, useChurches } from "@/hooks/use-queries";
import { supabase } from "@/lib/supabase/client";
import { logAudit } from "@/services/audit";
import { Field } from "./PanelHelpers";

export function DailyWordsAdmin() {
  const { data: words = [] } = useDailyWords();
  const { data: dwChurches = [] } = useChurches();
  const qc = useQueryClient();
  const [err, setErr] = useState("");
  const [churchId, setChurchId] = useState<string>("");
  const today = new Date().toISOString().slice(0,10);
  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } =
    useForm<DailyWordInput>({
      resolver: zodResolver(dailyWordSchema),
      defaultValues: { date: today, title: "Palavra do dia" },
    });

  async function onSubmit(v: DailyWordInput) {
    setErr("");
    const { data, error } = await supabase.from("daily_words").insert({
      date: v.date, title: v.title,
      verse_ref: v.verse_ref || null, verse_text: v.verse_text || null,
      reflection: v.reflection || null,
      prayer: v.prayer || null,
      is_active: true,
      church_id: churchId || null,
    }).select().single();
    if (error) { setErr(error.message); return; }
    await logAudit(supabase, "insert", "daily_words", data.id, { title: v.title });
    reset({ date: today, title: "Palavra do dia" });
    qc.invalidateQueries({ queryKey: ["daily-words"] });
    qc.invalidateQueries({ queryKey: ["todays-word"] });
  }
  async function remove(id: string, title: string) {
    if (!confirm("Remover esta palavra?")) return;
    const { error } = await supabase.from("daily_words").delete().eq("id", id);
    if (!error) {
      await logAudit(supabase, "delete", "daily_words", id, { title });
      qc.invalidateQueries({ queryKey: ["daily-words"] });
      qc.invalidateQueries({ queryKey: ["todays-word"] });
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Cadastrar Palavra do dia</CardTitle>
          <CardDescription>A palavra mais recente (com data ≤ hoje) aparece na página pública.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <Field label="Para qual comunidade?">
              <select value={churchId} onChange={(e) => setChurchId(e.target.value)}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                <option value="">— Global (todas as comunidades) —</option>
                {dwChurches.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Data" error={errors.date?.message}><DatePicker value={watch("date") ?? ""} onChange={(v) => setValue("date", v)} placeholder="Data" /></Field>
              <Field label="Título" error={errors.title?.message}><Input {...register("title")} placeholder="Palavra do dia" /></Field>
            </div>
            <Field label="Referência bíblica" error={errors.verse_ref?.message}>
              <Input {...register("verse_ref")} placeholder="Ex: Salmos 23:1" />
            </Field>
            <Field label="Texto do versículo" error={errors.verse_text?.message}>
              <textarea {...register("verse_text")} rows={2} className="w-full rounded-md border bg-background p-3 text-sm" placeholder="Texto bíblico" />
            </Field>
            <Field label="Reflexão" error={errors.reflection?.message}>
              <textarea {...register("reflection")} rows={3} className="w-full rounded-md border bg-background p-3 text-sm" placeholder="Reflexão pastoral" />
            </Field>
            <Field label="Oração" error={errors.prayer?.message}>
              <textarea {...register("prayer")} rows={3} className="w-full rounded-md border bg-background p-3 text-sm" placeholder="Oração inspirada no texto (opcional)" />
            </Field>
            {err && <p className="text-sm text-destructive">{err}</p>}
            <Button type="submit" disabled={isSubmitting} className="gap-2"><Plus className="h-4 w-4" /> Cadastrar palavra</Button>
          </form>
        </CardContent>
      </Card>
      <h3 className="font-display text-lg text-navy">Palavras cadastradas ({words.length})</h3>
      <div className="space-y-2">
        {words.length === 0 && <p className="text-sm italic text-muted">Nenhuma palavra cadastrada. A página pública usará o conteúdo padrão.</p>}
        {words.map((w) => (
          <div key={w.id} className="flex items-start gap-3 rounded-xl border bg-card p-4">
            <div className="text-center">
              <b className="block font-display text-sm text-gold">{new Date(w.date).toLocaleDateString("pt-BR", {day:"2-digit",month:"short"}).replace(".","")}</b>
            </div>
            <div className="flex-1 border-l border-border pl-3">
              <b className="text-navy">{w.title}</b>
              {w.verse_ref && <p className="text-xs font-semibold text-gold">{w.verse_ref}</p>}
              {w.verse_text && <p className="mt-1 font-display italic text-sm text-ink">"{w.verse_text}"</p>}
              {w.reflection && <p className="mt-1 text-xs text-muted">{w.reflection}</p>}
              {w.prayer && <p className="mt-1 rounded bg-gold/5 p-2 text-xs italic text-ink">🙏 {w.prayer}</p>}
            </div>
            <Button onClick={() => remove(w.id, w.title)} variant="destructive" size="sm"><Trash2 className="h-3.5 w-3.5" /></Button>
          </div>
        ))}
      </div>
    </div>
  );
}
