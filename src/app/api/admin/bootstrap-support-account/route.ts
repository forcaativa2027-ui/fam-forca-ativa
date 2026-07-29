import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/admin/bootstrap-support-account
 *
 * GOV-002 §3 — Conta administrativa inicial fixa. Cria (se ainda não
 * existir) a conta de suporte técnico tecnologiaagilize@gmail.com.
 *
 * Diferente de /create-member: essa conta NASCE SEM PRIVILÉGIO
 * NENHUM (role "membro", sem church_id/member vinculado). O único
 * efeito é abrir uma DELEGAÇÃO PENDENTE de módulo "administrativo",
 * escopo nacional — ou seja, a conta só ganha acesso de fato quando
 * um Apóstolo aprovar essa delegação na tela normal de Delegações
 * (aba Pendentes). É essa aprovação que representa a "ativação".
 *
 * Só quem já é Apóstolo pode chamar essa rota.
 */

const SUPPORT_EMAIL = "tecnologiaagilize@gmail.com";

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }); }

  const access_token = String(body.access_token ?? "");
  if (!access_token) return NextResponse.json({ error: "Token de autenticação ausente" }, { status: 401 });

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
    return NextResponse.json({ error: "Apenas o Apóstolo pode provisionar essa conta." }, { status: 403 });
  }

  // 2) Já existe? Se sim, só confirma que existe (idempotente) e devolve o id.
  const { data: existingUsers } = await admin.auth.admin.listUsers();
  const already = existingUsers?.users?.find((u) => u.email?.toLowerCase() === SUPPORT_EMAIL);

  let supportUserId: string;
  if (already) {
    supportUserId = already.id;
  } else {
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: SUPPORT_EMAIL,
      email_confirm: true,
      user_metadata: { full_name: "Suporte Técnico — Agilize Tecnologia" },
    });
    if (createErr || !created.user) {
      return NextResponse.json({ error: createErr?.message ?? "Erro ao criar a conta" }, { status: 400 });
    }
    supportUserId = created.user.id;
    await admin.from("profiles").update({ full_name: "Suporte Técnico — Agilize Tecnologia", role: "membro" }).eq("id", supportUserId);

    // Envia link de definição de senha (a conta nasce sem senha própria)
    await admin.auth.resetPasswordForEmail(SUPPORT_EMAIL, { redirectTo: `${url.replace(".supabase.co", "")}/nova-senha` }).catch(() => {});
  }

  // 3) Garante a delegação pendente (idempotente — não duplica se já existir uma pendente/ativa)
  const { data: existingDelegation } = await admin
    .from("module_delegations")
    .select("id, status")
    .eq("profile_id", supportUserId)
    .eq("module", "administrativo")
    .eq("scope", "nacional")
    .maybeSingle();

  if (!existingDelegation) {
    await admin.from("module_delegations").insert({
      profile_id: supportUserId,
      module: "administrativo",
      scope: "nacional",
      scope_name: "Nacional",
      trust_level: 5,
      status: "pendente",
      request_reason: "Conta de suporte técnico (Agilize Tecnologia) — GOV-002 §3. Requer aprovação explícita do Apóstolo pra ativar.",
    });
  }

  return NextResponse.json({ ok: true, already_existed: !!already, user_id: supportUserId });
}
