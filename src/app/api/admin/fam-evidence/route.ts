import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { adminClient } from "@/lib/supabase/admin";

const ALLOWED_SCAN_STATUS = new Set(["clean", "infected", "error"]);

async function getAdminCaller(req: Request) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  const verifier = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: { user } } = await verifier.auth.getUser();
  if (!user) return null;
  const admin = adminClient();
  const { data: attendant } = await admin.from("fam_attendants").select("id").eq("profile_id", user.id).eq("status", "active").maybeSingle();
  return attendant ? { user, admin } : null;
}

async function audit(admin: ReturnType<typeof adminClient>, actorUserId: string | null, attachment: { id: string; case_id?: string | null; conversation_id?: string | null }, eventType: string, metadata: Record<string, unknown>) {
  await admin.from("fam_audit_events").insert({
    actor_user_id: actorUserId,
    risk_case_id: attachment.case_id ?? null,
    conversation_id: attachment.conversation_id ?? null,
    event_type: eventType,
    metadata: { attachment_id: attachment.id, ...metadata },
  });
}

/** Recebe somente callbacks de um scanner configurado no servidor. */
export async function POST(req: Request) {
  const scannerToken = process.env.FAM_MALWARE_SCAN_TOKEN;
  if (!scannerToken || req.headers.get("x-fam-scanner-token") !== scannerToken) {
    return NextResponse.json({ error: "Scanner não autorizado." }, { status: 401 });
  }
  let body: { attachment_id?: unknown; status?: unknown; engine?: unknown; sha256?: unknown; error?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "JSON inválido." }, { status: 400 }); }
  const attachmentId = String(body.attachment_id ?? "");
  const status = String(body.status ?? "");
  if (!attachmentId || !ALLOWED_SCAN_STATUS.has(status)) return NextResponse.json({ error: "attachment_id e status válido são obrigatórios." }, { status: 400 });

  let admin;
  try { admin = adminClient(); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Configuração inválida." }, { status: 500 }); }
  const { data: attachment, error: findError } = await admin.from("fam_risk_attachments").select("id, case_id, conversation_id, malware_scan_status, deleted_at").eq("id", attachmentId).maybeSingle();
  if (findError || !attachment) return NextResponse.json({ error: "Anexo não encontrado." }, { status: 404 });
  if (attachment.deleted_at) return NextResponse.json({ error: "Anexo já excluído." }, { status: 409 });
  if (attachment.malware_scan_status === "infected" && status === "clean") return NextResponse.json({ error: "Um anexo infectado não pode ser marcado como limpo sem novo upload." }, { status: 409 });

  const now = new Date().toISOString();
  const { error } = await admin.from("fam_risk_attachments").update({
    malware_scan_status: status,
    scan_engine: String(body.engine ?? "unknown"),
    scan_attempted_at: now,
    scanned_at: status === "error" ? null : now,
    quarantined_at: status === "clean" ? null : now,
    sha256: body.sha256 ? String(body.sha256) : null,
  }).eq("id", attachmentId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await audit(admin, null, attachment, "attachment_scan_completed", { status, engine: body.engine ?? "unknown", error: body.error ?? null });
  return NextResponse.json({ ok: true, attachment_id: attachmentId, status });
}

/** Verifica o hash do pacote congelado sem retornar o conteúdo do snapshot. */
export async function PATCH(req: Request) {
  const caller = await getAdminCaller(req);
  if (!caller) return NextResponse.json({ error: "Acesso restrito a atendentes FAM ativos." }, { status: 403 });
  let body: { request_id?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "JSON inválido." }, { status: 400 }); }
  const requestId = String(body.request_id ?? "");
  if (!requestId) return NextResponse.json({ error: "request_id é obrigatório." }, { status: 400 });
  const { data, error } = await caller.admin.rpc("fam_verify_referral_package", { p_request_id: requestId });
  if (error) {
    const status = error.message === "referral_request_not_found" ? 404 : error.message === "referral_package_not_frozen" ? 409 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
  const result = Array.isArray(data) ? data[0] : data;
  return NextResponse.json({ ok: true, request_id: result?.request_id, is_valid: result?.is_valid, package_hash: result?.package_hash, verified_at: result?.verified_at });
}

/** Expurgo lógico de metadados vencidos; o arquivo físico é removido somente após a atualização auditada. */
export async function DELETE(req: Request) {
  const caller = await getAdminCaller(req);
  if (!caller) return NextResponse.json({ error: "Acesso restrito a atendentes FAM ativos." }, { status: 403 });
  const { data: expired, error } = await caller.admin.from("fam_risk_attachments")
    .select("id, storage_path, case_id, conversation_id")
    .is("deleted_at", null)
    .eq("legal_hold", false)
    .lt("retention_expires_at", new Date().toISOString())
    .limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let deleted = 0;
  for (const attachment of expired ?? []) {
    const { error: storageError } = await caller.admin.storage.from("fam-attachments").remove([attachment.storage_path]);
    if (storageError) continue;
    const { error: updateError } = await caller.admin.from("fam_risk_attachments").update({ deleted_at: new Date().toISOString(), deletion_reason: "retention_expired" }).eq("id", attachment.id).is("deleted_at", null);
    if (updateError) continue;
    await audit(caller.admin, caller.user.id, attachment, "attachment_retention_purged", { reason: "retention_expired" });
    deleted += 1;
  }
  return NextResponse.json({ ok: true, scanned: expired?.length ?? 0, deleted });
}
