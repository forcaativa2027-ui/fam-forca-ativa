"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/lib/supabase";

interface PurgePreview { eligible_count: number; cutoff: string; }
interface PurgeResult { scanned: number; deleted: number; }

async function adminRequest(path: string, init?: RequestInit) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Sessão expirada. Faça login novamente.");
  const response = await fetch(path, { ...init, headers: { Authorization: `Bearer ${session.access_token}`, ...(init?.headers ?? {}) } });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Operação não concluída.");
  return data;
}

export default function FamExpurgoAdmin() {
  const [preview, setPreview] = useState<PurgePreview | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadPreview() {
    setBusy(true); setError("");
    try { setPreview(await adminRequest("/api/admin/fam-evidence")); }
    catch (e) { setError(e instanceof Error ? e.message : "Não foi possível carregar a prévia."); }
    finally { setBusy(false); }
  }
  useEffect(() => { void loadPreview(); }, []);

  async function purge() {
    if (!confirmed) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const result = (await adminRequest("/api/admin/fam-evidence", { method: "DELETE" })) as PurgeResult;
      setMessage(`Operação concluída: ${result.deleted} evidência(s) expirada(s) removida(s) de ${result.scanned} elegível(eis).`);
      setConfirmed(false);
      await loadPreview();
    } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível executar o expurgo."); }
    finally { setBusy(false); }
  }

  return <main className="min-h-screen bg-slate-50 p-4"><div className="mx-auto max-w-3xl space-y-5 py-8">
    <Link href="/admin/fam-atendimento" className="inline-flex items-center gap-2 text-sm font-semibold text-fam-deep-plum"><ArrowLeft className="h-4 w-4" /> Voltar à Central de Atendimento</Link>
    <header className="rounded-2xl bg-fam-deep-plum p-6 text-white"><div className="flex items-center gap-3"><ShieldCheck className="h-6 w-6 text-fam-gold" /><h1 className="font-display text-2xl font-bold">Expurgo de evidências</h1></div><p className="mt-2 text-sm text-white/75">Operação restrita a atendentes FAM ativas. O expurgo respeita `legal_hold` e registra auditoria.</p></header>
    {error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}{message && <p role="status" className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p>}
    <Card><CardHeader><CardTitle>Prévia segura</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-sm text-fam-muted">A prévia mostra apenas a quantidade de arquivos elegíveis. Não exibe nomes, caminhos, conteúdo ou identificadores de casos.</p><div className="rounded-lg bg-fam-lavender/40 p-4 text-sm text-fam-deep-plum"><b>{preview?.eligible_count ?? "—"}</b> evidência(s) estão elegíveis pela retenção atual. {preview?.cutoff && <>Data de corte: {new Date(preview.cutoff).toLocaleString("pt-BR")}.</>}</div><Button variant="outline" onClick={() => void loadPreview()} disabled={busy}><RefreshCw className="mr-2 h-4 w-4" /> Atualizar prévia</Button></CardContent></Card>
    <Card className="border-fam-danger/30"><CardHeader><CardTitle>Confirmação necessária</CardTitle></CardHeader><CardContent className="space-y-4"><label className="flex items-start gap-3 text-sm text-fam-deep-plum"><Checkbox checked={confirmed} onCheckedChange={(value) => setConfirmed(value === true)} /><span>Confirmo que revisei a prévia, que a operação deve remover somente evidências vencidas sem `legal_hold` e que o resultado será registrado na auditoria.</span></label><Button variant="destructive" disabled={!confirmed || busy || !preview?.eligible_count} onClick={() => void purge()}><Trash2 className="mr-2 h-4 w-4" />{busy ? "Processando..." : "Executar expurgo"}</Button></CardContent></Card>
  </div></main>;
}
