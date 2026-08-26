"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Upload, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase/client";

const SAMPLE = "email,full_name,phone,consent_at\nana@example.com,Ana da Silva,61999999999,2026-08-26T12:00:00Z";

type Result = { queued?: number; duplicated?: number; processed?: number; remaining?: number; error?: string };

export default function FamImportacaoPage() {
  const [csv, setCsv] = useState(SAMPLE);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function submit() {
    if (!confirmed || busy) return;
    setBusy(true); setResult(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) { setResult({ error: "Sua sessão expirou. Faça login novamente." }); return; }
      const response = await fetch("/api/admin/fam-import", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ csv, confirm: confirmed }),
      });
      const data = await response.json() as Result;
      setResult(response.ok ? data : { error: data.error ?? "Não foi possível processar o lote." });
    } catch { setResult({ error: "Falha de comunicação com o servidor." }); }
    finally { setBusy(false); }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4">
      <div className="mx-auto max-w-3xl space-y-4 py-8">
        <Link href="/admin/fam-atendimento" className="inline-flex items-center gap-2 text-sm font-semibold text-navy"><ArrowLeft className="h-4 w-4" /> Voltar ao atendimento FAM</Link>
        <Card>
          <CardHeader><CardTitle>Importação de usuários FAM</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <p className="flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4" /> Operação controlada</p>
              <p className="mt-1">Os convites serão associados à sede FAM-Samambaia-DF. Não inclua senhas no arquivo. Cada linha deve ter consentimento registrado.</p>
            </div>
            <div>
              <label htmlFor="fam-csv" className="mb-2 block text-sm font-semibold text-navy">CSV do lote</label>
              <Textarea id="fam-csv" value={csv} onChange={(e) => setCsv(e.target.value)} rows={12} className="font-mono text-xs" />
              <p className="mt-1 text-xs text-muted">Cabeçalho obrigatório: email, full_name, phone opcional, consent_at. Limite de 100 linhas por envio.</p>
            </div>
            <label className="flex items-start gap-2 text-sm text-navy">
              <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-1" />
              <span>Confirmo que possuo autorização para importar estes dados e que os consentimentos informados são verdadeiros.</span>
            </label>
            <Button type="button" onClick={submit} disabled={!confirmed || busy} className="gap-2">
              <Upload className="h-4 w-4" /> {busy ? "Processando lote..." : "Importar e processar lote"}
            </Button>
            {result?.error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{result.error}</p>}
            {result && !result.error && <div className="rounded-md bg-emerald-50 px-3 py-3 text-sm text-emerald-900"><p className="flex items-center gap-2 font-semibold"><CheckCircle2 className="h-4 w-4" /> Lote registrado</p><p className="mt-1">Novos na fila: {result.queued ?? 0} · Já existentes na fila: {result.duplicated ?? 0} · Convites enviados: {result.processed ?? 0} · Restantes: {result.remaining ?? 0}</p></div>}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
