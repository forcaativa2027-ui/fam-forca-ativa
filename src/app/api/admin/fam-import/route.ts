import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { adminClient } from "@/lib/supabase/admin";

const MAX_ROWS_PER_REQUEST = 100;
const MAX_ROWS_TO_PROCESS = 25;

type ImportRow = { email: string; full_name: string; phone: string | null; consent_at: string };

function parseCsv(csv: string): ImportRow[] {
  const lines = csv.replace(/^\uFEFF/, "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) throw new Error("O CSV deve conter cabeçalho e pelo menos uma linha.");
  const headers = lines[0].split(",").map((value) => value.trim().toLowerCase());
  const emailIndex = headers.indexOf("email");
  const nameIndex = headers.indexOf("full_name") >= 0 ? headers.indexOf("full_name") : headers.indexOf("nome");
  const phoneIndex = headers.indexOf("phone") >= 0 ? headers.indexOf("phone") : headers.indexOf("telefone");
  const consentIndex = headers.indexOf("consent_at") >= 0 ? headers.indexOf("consent_at") : headers.indexOf("consentimento");
  if (emailIndex < 0 || nameIndex < 0 || consentIndex < 0) {
    throw new Error("O cabeçalho deve conter email, full_name (ou nome) e consent_at (ou consentimento).");
  }
  if (lines.length - 1 > MAX_ROWS_PER_REQUEST) throw new Error(`Envie no máximo ${MAX_ROWS_PER_REQUEST} linhas por lote.`);
  return lines.slice(1).map((line, index) => {
    const values = line.split(",").map((value) => value.trim().replace(/^"|"$/g, ""));
    const email = String(values[emailIndex] ?? "").toLowerCase();
    const full_name = String(values[nameIndex] ?? "");
    const phone = phoneIndex >= 0 ? String(values[phoneIndex] ?? "") || null : null;
    const consent_at = String(values[consentIndex] ?? "");
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error(`E-mail inválido na linha ${index + 2}.`);
    if (full_name.length < 3) throw new Error(`Nome inválido na linha ${index + 2}.`);
    if (!consent_at || Number.isNaN(Date.parse(consent_at))) throw new Error(`Consentimento inválido na linha ${index + 2}.`);
    return { email, full_name, phone, consent_at: new Date(consent_at).toISOString() };
  });
}

async function verifyCaller(req: Request) {
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

export async function POST(req: Request) {
  let body: { csv?: unknown; confirm?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "JSON inválido." }, { status: 400 }); }
  if (body.confirm !== true) return NextResponse.json({ error: "Confirme que possui autorização para importar estes dados." }, { status: 400 });
  if (typeof body.csv !== "string") return NextResponse.json({ error: "Envie o conteúdo CSV." }, { status: 400 });

  let auth: Awaited<ReturnType<typeof verifyCaller>>;
  try { auth = await verifyCaller(req); } catch { return NextResponse.json({ error: "Não foi possível validar a sessão administrativa." }, { status: 500 }); }
  if (!auth) return NextResponse.json({ error: "Acesso restrito a atendentes FAM ativos." }, { status: 403 });

  let rows: ImportRow[];
  try { rows = parseCsv(body.csv); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "CSV inválido." }, { status: 400 }); }

  const { data: sede, error: sedeError } = await auth.admin.from("churches").select("id").eq("slug", "fam-samambaia-df").eq("is_active", true).maybeSingle();
  if (sedeError || !sede) return NextResponse.json({ error: "A sede FAM-Samambaia-DF não está configurada ou ativa." }, { status: 409 });

  let queued = 0;
  let duplicated = 0;
  for (const row of rows) {
    const { error } = await auth.admin.from("fam_user_imports").insert({
      email: row.email, full_name: row.full_name, phone: row.phone,
      community_id: sede.id, consent_at: row.consent_at, created_by: auth.user.id,
    });
    if (error) {
      if (error.code === "23505") duplicated += 1;
      else return NextResponse.json({ error: error.message, queued, duplicated }, { status: 500 });
    } else queued += 1;
  }

  const { data: pending } = await auth.admin.from("fam_user_imports").select("id, email, full_name").eq("status", "pending").order("created_at").limit(MAX_ROWS_TO_PROCESS);
  let processed = 0;
  for (const row of pending ?? []) {
    const { error: updateError } = await auth.admin.from("fam_user_imports").update({ attempts: 1 }).eq("id", row.id);
    if (updateError) continue;
    const { data: invited, error: inviteError } = await auth.admin.auth.admin.inviteUserByEmail(row.email, {
      data: { full_name: row.full_name, fam_import: true },
    });
    if (!inviteError && invited.user) {
      await auth.admin.from("fam_user_imports").update({ status: "created", auth_user_id: invited.user.id, processed_at: new Date().toISOString(), last_error: null }).eq("id", row.id);
      processed += 1;
    } else {
      const message = inviteError?.message ?? "Falha ao enviar convite.";
      const alreadyExists = message.toLowerCase().includes("already") || message.toLowerCase().includes("registered");
      await auth.admin.from("fam_user_imports").update({ status: alreadyExists ? "already_exists" : "error", processed_at: new Date().toISOString(), last_error: message }).eq("id", row.id);
    }
  }

  return NextResponse.json({ ok: true, queued, duplicated, processed, remaining: Math.max(0, (pending?.length ?? 0) - processed) });
}
