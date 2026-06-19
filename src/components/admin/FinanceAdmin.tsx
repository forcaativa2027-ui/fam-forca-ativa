"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { financeSchema, type FinanceFormInput } from "@/schemas";
import { useChurches, useFinances } from "@/hooks/use-queries";
import { supabase } from "@/lib/supabase/client";
import { createFinance, deleteFinance } from "@/services/finance";
import { logAudit } from "@/services/audit";

const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

const KIND_LABELS: Record<string, string> = {
  dizimo: "Dízimo", oferta: "Oferta", primicia: "Primícia", missoes: "Missões",
  construcao: "Construção", outras_entradas: "Outras entradas",
  salario: "Salário", aluguel: "Aluguel", energia: "Energia",
  evangelismo: "Evangelismo", evento: "Evento", investimento: "Investimento",
  outras_saidas: "Outras saídas",
};
const ENTRADAS = ["dizimo","oferta","primicia","missoes","construcao","outras_entradas"];
const SAIDAS   = ["salario","aluguel","energia","evangelismo","evento","investimento","outras_saidas"];

export function FinanceAdmin() {
  const { data: churches = [] } = useChurches();
  const qc = useQueryClient();
  const today = new Date();
  const [churchId, setChurchId] = useState("");
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const { data: items = [] } = useFinances(churchId || null, year, month);
  const [err, setErr] = useState("");

  // Seleciona a sede automaticamente se não houver escolha
  const effectiveChurchId = churchId || churches.find((c) => c.type === "sede")?.id || churches[0]?.id || "";

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } =
    useForm<FinanceFormInput>({
      resolver: zodResolver(financeSchema),
      defaultValues: {
        direction: "entrada", kind: "dizimo",
        occurred_on: today.toISOString().slice(0,10),
        church_id: effectiveChurchId,
      },
    });
  const direction = watch("direction");

  async function onSubmit(v: FinanceFormInput) {
    setErr("");
    try {
      const created = await createFinance(supabase, {
        church_id: v.church_id, kind: v.kind, direction: v.direction,
        amount: v.amount,
        description: v.description, occurred_on: v.occurred_on,
        payer_name: v.payer_name,
      });
      await logAudit(supabase, "insert", "finances", created.id, { kind: v.kind, amount: v.amount });
      reset({
        direction: "entrada", kind: "dizimo",
        occurred_on: today.toISOString().slice(0,10),
        church_id: v.church_id,
      });
      qc.invalidateQueries({ queryKey: ["finances"] });
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Erro");
    }
  }
  async function remove(id: string) {
    if (!confirm("Apagar este lançamento?")) return;
    try {
      await deleteFinance(supabase, id);
      await logAudit(supabase, "delete", "finances", id);
      qc.invalidateQueries({ queryKey: ["finances"] });
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Erro");
    }
  }

  const entradas = items.filter((i) => i.direction === "entrada");
  const saidas = items.filter((i) => i.direction === "saida");
  const totalEntradas = entradas.reduce((s, i) => s + Number(i.amount), 0);
  const totalSaidas = saidas.reduce((s, i) => s + Number(i.amount), 0);
  const saldo = totalEntradas - totalSaidas;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Wallet className="h-5 w-5 text-gold" />Financeiro</CardTitle>
          <CardDescription>Entradas e saídas por igreja e período</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Igreja</Label>
              <select value={effectiveChurchId} onChange={(e) => setChurchId(e.target.value)}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                {churches.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Mês</Label>
              <select value={month} onChange={(e) => setMonth(Number(e.target.value))}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Ano</Label>
              <Input type="number" min="2020" max="2100" value={year}
                onChange={(e) => setYear(Number(e.target.value))} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card><CardContent className="pt-6">
          <div className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-green-600" /><b className="text-xs uppercase text-muted">Entradas</b></div>
          <p className="mt-2 font-display text-2xl font-bold text-green-700">R$ {totalEntradas.toFixed(2)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <div className="flex items-center gap-2"><TrendingDown className="h-5 w-5 text-red-600" /><b className="text-xs uppercase text-muted">Saídas</b></div>
          <p className="mt-2 font-display text-2xl font-bold text-red-700">R$ {totalSaidas.toFixed(2)}</p>
        </CardContent></Card>
        <Card className={saldo >= 0 ? "bg-navy text-white" : "bg-destructive text-white"}><CardContent className="pt-6">
          <div className="flex items-center gap-2"><Wallet className="h-5 w-5" /><b className="text-xs uppercase opacity-80">Saldo</b></div>
          <p className="mt-2 font-display text-2xl font-bold">R$ {saldo.toFixed(2)}</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Novo lançamento</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <input type="hidden" {...register("church_id")} value={effectiveChurchId} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Tipo">
                <select {...register("direction")} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                  <option value="entrada">Entrada</option>
                  <option value="saida">Saída</option>
                </select>
              </Field>
              <Field label="Categoria">
                <select {...register("kind")} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                  {(direction === "saida" ? SAIDAS : ENTRADAS).map((k) => (
                    <option key={k} value={k}>{KIND_LABELS[k]}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Valor (R$)" error={errors.amount?.message}>
                <Input type="number" step="0.01" min="0" {...register("amount")} placeholder="0,00" />
              </Field>
              <Field label="Data" error={errors.occurred_on?.message}>
                <Input type="date" {...register("occurred_on")} />
              </Field>
            </div>
            {direction === "entrada" && (
              <Field label="Nome de quem ofertou (opcional)"><Input {...register("payer_name")} placeholder="Ex: Maria Silva" /></Field>
            )}
            <Field label="Descrição"><Input {...register("description")} placeholder="Detalhes" /></Field>
            {err && <p className="text-sm text-destructive">{err}</p>}
            <Button type="submit" disabled={isSubmitting} className="gap-2"><Plus className="h-4 w-4" />Lançar</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lançamentos de {MONTHS[month-1]}/{year} ({items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-sm italic text-muted">Nenhum lançamento neste período.</p>
          ) : (
            <div className="space-y-2">
              {items.map((i) => (
                <div key={i.id} className={`flex items-center gap-3 rounded-xl border p-3 ${i.direction === "entrada" ? "bg-green-50/50" : "bg-red-50/50"}`}>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <b className="text-navy">{KIND_LABELS[i.kind] ?? i.kind}</b>
                      <span className="text-[11px] text-muted">{new Date(i.occurred_on).toLocaleDateString("pt-BR")}</span>
                    </div>
                    {i.description && <p className="text-xs text-muted">{i.description}</p>}
                    {i.payer_name && <p className="text-[11px] text-muted">por {i.payer_name}</p>}
                  </div>
                  <b className={`text-sm font-extrabold ${i.direction === "entrada" ? "text-green-700" : "text-red-700"}`}>
                    {i.direction === "entrada" ? "+" : "-"} R$ {Number(i.amount).toFixed(2)}
                  </b>
                  <Button onClick={() => remove(i.id)} variant="destructive" size="sm"><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
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
