import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface NotifiableListener {
  id: string;
  name: string;
  email: string;
  token: string;
  program_ids: string[];
}

interface OnAirProgram {
  program_id: string;
  title: string;
  description: string | null;
  host_name: string | null;
  mode: string;
  start_time: string | null;
  end_time: string | null;
}

async function sendEmail(opts: {
  from: string;
  to: string;
  subject: string;
  html: string;
}): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, error: "RESEND_API_KEY ausente" };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: opts.from,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: `Resend ${res.status}: ${body.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  const isCron =
    request.headers.get("x-vercel-cron") === "1" ||
    (!!secret && auth === `Bearer ${secret}`);
  if (!isCron) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = url && serviceKey
    ? createSupabaseClient(url, serviceKey, { auth: { persistSession: false } })
    : await createSupabaseServerClient();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cec-painel.vercel.app";
  const from = process.env.RESEND_FROM ?? "Rádio Web <onboarding@resend.dev>";

  const { data: churchRows } = await supabase
    .from("radio_listeners")
    .select("church_id")
    .eq("status", "ativo")
    .not("church_id", "is", null);

  const churchIds = Array.from(new Set((churchRows ?? []).map((r) => r.church_id).filter(Boolean))) as string[];
  const summary: { church: string; program: string | null; notified: number; skipped: boolean }[] = [];

  for (const churchId of churchIds) {
    const { data: onAirRows } = await supabase.rpc("radio_whats_on_air", {
      p_church_id: churchId,
    });
    const onAir = (onAirRows ?? [])[0] as OnAirProgram | undefined;

    if (!onAir) {
      summary.push({ church: churchId, program: null, notified: 0, skipped: true });
      continue;
    }

    const { data: state } = await supabase
      .from("radio_notification_state")
      .select("program_id")
      .eq("church_id", churchId)
      .maybeSingle();

    if (state?.program_id === onAir.program_id) {
      summary.push({ church: churchId, program: onAir.title, notified: 0, skipped: true });
      continue;
    }

    const { data: listeners } = await supabase.rpc("radio_notifiable_listeners", {
      p_church_id: churchId,
    });
    const { data: config } = await supabase
      .from("radio_config")
      .select("display_name")
      .eq("church_id", churchId)
      .maybeSingle();

    const station = config?.display_name ?? "Rádio Web";
    const timeLabel = onAir.start_time?.slice(0, 5) ?? "";
    const subject = `Agora no ar: ${onAir.title}`;

    let notified = 0;
    for (const l of (listeners ?? []) as NotifiableListener[]) {
      const wantsThisProgram =
        !l.program_ids || l.program_ids.length === 0 || l.program_ids.includes(onAir.program_id);
      if (!wantsThisProgram) continue;

      const unsubscribeUrl = `${baseUrl}/radio/assinar/desinscrever?token=${l.token}`;
      const html = `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto">
          <h2 style="color:#1a1a2e">${subject}</h2>
          <p>Olá, <strong>${l.name}</strong>! O programa <strong>${onAir.title}</strong> está no ar agora${timeLabel ? ` (a partir das ${timeLabel})` : ""}.</p>
          ${onAir.host_name ? `<p>com ${onAir.host_name}</p>` : ""}
          <p><a href="${baseUrl}/radio" style="background:#d4af37;color:#1a1a2e;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:bold">Ouvir ${station}</a></p>
          <p style="font-size:12px;color:#888">Você recebeu este e-mail porque se inscreveu na rádio. Para parar de receber, <a href="${unsubscribeUrl}">clique aqui</a>.</p>
        </div>`;

      const { ok, error } = await sendEmail({ from, to: l.email, subject, html });
      await supabase.from("radio_notification_log").insert({
        listener_id: l.id,
        program_id: onAir.program_id,
        church_id: churchId,
        channel: ok ? "email" : "log",
        status: ok ? "sent" : "failed",
        error: ok ? null : error,
      });
      notified += 1;
    }

    await supabase.from("radio_notification_state").upsert(
      { church_id: churchId, program_id: onAir.program_id, notified_at: new Date().toISOString() },
      { onConflict: "church_id" }
    );

    summary.push({ church: churchId, program: onAir.title, notified, skipped: false });
  }

  return NextResponse.json({ ok: true, processed: churchIds.length, summary });
}