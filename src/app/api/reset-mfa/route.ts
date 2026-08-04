import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/admin/reset-mfa
 *
 * UX-004 — Redefinição de 2FA (recuperação de conta travada). Remove
 * todos os fatores de MFA de um usuário específico, usando a chave de
 * serviço — não depende da sessão do próprio usuário estar em AAL2
 * (o que resolveria o problema, mas é exatamente o que ele não
 * consegue alcançar quando está travado).
 *
 * Só quem já é Apóstolo pode chamar essa rota. A ação fica registrada
 * na auditoria.
 */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }); }

  const access_token = String(body.access_token ?? "");
  const target_profile_id = String(body.target_profile_id ?? "");
  if (!access_token) return NextResponse.json({ error: "Token de autenticação ausente" }, { status: 401 });
  if (!target_profile_id) return NextResponse.json({ error: "Usuário alvo não informado" }, { status: 400 });

  let admin;
  try {
    admin = adminClient();
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Configuração inválida" }, { status: 500 });
  }

  // 1) Verifica autor: precisa ser Apóstolo
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const verifier = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${access_token}` } } });
  const { data: { user: caller } } = await verifier.auth.getUser();
  if (!caller) return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });

  const { data: callerProfile } = await admin.from("profiles").select("role").eq("id", caller.id).maybeSingle();
  if (!callerProfile || callerProfile.role !== "apostolo") {
    return NextResponse.json({ error: "Apenas o Apóstolo pode redefinir o 2FA de outra pessoa." }, { status: 403 });
  }

  // 2) Remove todos os fatores de MFA do usuário alvo
  const { data: factorsData, error: listErr } = await admin.auth.admin.mfa.listFactors({ userId: target_profile_id });
  if (listErr) return NextResponse.json({ error: listErr.message }, { status: 400 });

  const factors = factorsData?.factors ?? [];
  for (const f of factors) {
    const { error: delErr } = await admin.auth.admin.mfa.deleteFactor({ id: f.id, userId: target_profile_id });
    if (delErr) return NextResponse.json({ error: `Erro ao remover fator ${f.id}: ${delErr.message}` }, { status: 400 });
  }

  // 3) Audita a ação
  try {
    await admin.from("audit_logs").insert({
      actor_id: caller.id, action: "delete", entity: "mfa_factors", entity_id: target_profile_id,
      details: { motivo: "redefinicao_admin", fatores_removidos: factors.length },
    });
  } catch { /* auditoria é best-effort, não bloqueia a operação principal */ }

  return NextResponse.json({ ok: true, removed: factors.length });
}
