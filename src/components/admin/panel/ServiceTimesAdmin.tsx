"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { serviceTimeSchema, type ServiceTimeInput } from "@/schemas";
import { useChurches, useAllServiceTimes, useMyProfile, useTenantModules } from "@/hooks/use-queries";
import { TENANT_MODULE_DEFAULTS } from "@/services/tenantModules";
import { supabase } from "@/lib/supabase/client";
import { logAudit } from "@/services/audit";
import { Field } from "./PanelHelpers";

const WEEKDAY_OPTS = [
  ["domingo","Domingo"],["segunda","Segunda"],["terca","Terça"],
  ["quarta","Quarta"],["quinta","Quinta"],["sexta","Sexta"],["sabado","Sábado"],
] as const;

export function ServiceTimesAdmin() {
  const { data: profile } = useMyProfile();
  const { data: tenantModules = TENANT_MODULE_DEFAULTS } = useTenantModules(profile?.church_id);
  const { data: churches = [] } = useChurches();
  const { data: services = [] } = useAllServiceTimes();
  const qc = useQueryClient();
  const [err, setErr] = useState("");
  const sede = churches.find((c) => c.type === "sede") ?? churches[0] ?? null;
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<ServiceTimeInput>({
      resolver: zodResolver(serviceTimeSchema),
      defaultValues: { church_id: sede?.id, weekday: "domingo", sort_order: 0 },
    });

  if (tenantModules.services === false) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Programação de actividades desactivada</CardTitle>
          <CardDescription>Este tenant não utiliza o módulo de Cultos ou horários de serviços.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted">Para a FAM, reuniões e eventos devem ser cadastrados na Agenda.</p>
        </CardContent>
      </Card>
    );
  }

  async function onSubmit(v: ServiceTimeInput) {
    setErr("");
    const { data, error } = await supabase.from("church_info").insert({
      church_id: v.church_id, weekday: v.weekday, time: v.time,
      description: v.description || null, sort_order: v.sort_order, is_active: true,
    }).select().single();
    if (error) { setErr(error.message); return; }
    await logAudit(supabase, "insert", "church_info", data.id, { description: v.description });
    reset({ church_id: sede?.id, weekday: "domingo", sort_order: 0 });
    qc.invalidateQueries({ queryKey: ["service-times-all"] });
    qc.invalidateQueries({ queryKey: ["service-times", v.church_id] });
  }
  async function remove(id: string) {
    if (!confirm("Remover este culto?")) return;
    const { error } = await supabase.from("church_info").delete().eq("id", id);
    if (!error) {
      await logAudit(supabase, "delete", "church_info", id);
      qc.invalidateQueries({ queryKey: ["service-times-all"] });
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Adicionar horário de culto</CardTitle>
          <CardDescription>Cultos cadastrados aqui aparecem na aba "Cultos" da página pública.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <Field label="Igreja" error={errors.church_id?.message}>
              <select {...register("church_id")} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                {churches.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Dia da semana" error={errors.weekday?.message}>
                <select {...register("weekday")} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                  {WEEKDAY_OPTS.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </Field>
              <Field label="Hora (HH:MM)" error={errors.time?.message}><Input type="time" {...register("time")} /></Field>
            </div>
            <Field label="Descrição" error={errors.description?.message}>
              <Input {...register("description")} placeholder="Ex: Culto da manhã" />
            </Field>
            <Field label="Ordem (menor aparece primeiro)" error={errors.sort_order?.message}>
              <Input type="number" min="0" {...register("sort_order")} />
            </Field>
            {err && <p className="text-sm text-destructive">{err}</p>}
            <Button type="submit" disabled={isSubmitting} className="gap-2"><Plus className="h-4 w-4" /> Adicionar culto</Button>
          </form>
        </CardContent>
      </Card>
      <h3 className="font-display text-lg text-navy">Cultos cadastrados ({services.length})</h3>
      <div className="space-y-2">
        {services.length === 0 && <p className="text-sm italic text-muted">Nenhum culto cadastrado. A página pública usará os horários padrão.</p>}
        {services.map((s) => {
          const church = churches.find((c) => c.id === s.church_id);
          return (
            <div key={s.id} className="flex items-center gap-3 rounded-xl border bg-card p-3">
              <div className="text-center">
                <b className="block font-display text-lg text-navy">{s.time.slice(0,5)}</b>
                <span className="text-[10px] font-bold uppercase text-muted">{s.weekday}</span>
              </div>
              <div className="flex-1 border-l border-border pl-3">
                <b className="text-navy">{s.description ?? "Culto"}</b>
                <p className="text-xs text-muted">{church?.name ?? "Igreja"}</p>
              </div>
              <Button onClick={() => remove(s.id)} variant="destructive" size="sm"><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
