import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { purgeExpiredFamEvidence } from "@/services/famEvidencePurge";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const authorization = req.headers.get("authorization");
  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  try {
    const result = await purgeExpiredFamEvidence(adminClient(), null);
    return NextResponse.json({ ok: true, mode: "scheduled", ...result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Expurgo agendado não concluído." }, { status: 500 });
  }
}
