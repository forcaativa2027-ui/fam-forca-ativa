import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { adminClient } from "@/lib/supabase/admin";
import { transcribeAudio, generateSummaryTags, inferMimeFromUrl } from "@/lib/transcribe";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const MAX_AUDIO_BYTES = 25 * 1024 * 1024; // limite do Whisper API

/**
 * POST /api/radio/transcribe
 * Body: { episode_id, access_token, force? }
 * Transcreve o áudio do episódio (Whisper) e gera resumo + tags (IA com
 * fallback heurístico). Acesso restrito a apóstolos/pastores.
 */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const episode_id = String(body.episode_id ?? "");
  const access_token = String(body.access_token ?? "");
  const force = !!body.force;

  if (!episode_id) return NextResponse.json({ error: "episode_id ausente" }, { status: 400 });
  if (!access_token) return NextResponse.json({ error: "Token de autenticação ausente" }, { status: 401 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return NextResponse.json({ error: "Configuração inválida" }, { status: 500 });

  let admin;
  try {
    admin = adminClient();
  } catch {
    return NextResponse.json({ error: "SERVICE_ROLE_KEY não configurada" }, { status: 500 });
  }

  const verifier = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${access_token}` } },
  });
  const { data: { user: caller } } = await verifier.auth.getUser();
  if (!caller) return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });

  const { data: callerProfile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", caller.id)
    .maybeSingle();
  if (!callerProfile || !["apostolo", "pastor"].includes(callerProfile.role)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { data: episode } = await admin
    .from("radio_episodes")
    .select("id, audio_url, transcript_text, transcript_status, title")
    .eq("id", episode_id)
    .maybeSingle();
  if (!episode) return NextResponse.json({ error: "Episódio não encontrado" }, { status: 404 });

  if (!force && episode.transcript_status === "done") {
    return NextResponse.json({ ok: true, already: true });
  }

  await admin
    .from("radio_episodes")
    .update({ transcript_status: "processing", transcript_error: null, transcript_updated_at: new Date().toISOString() })
    .eq("id", episode_id);

  try {
    let transcript = (episode.transcript_text ?? "").trim();

    if (!transcript) {
      if (!episode.audio_url) {
        throw new Error("Episódio sem áudio e sem transcrição manual.");
      }
      const openaiKey = process.env.OPENAI_API_KEY;
      if (!openaiKey) {
        throw new Error("OPENAI_API_KEY não configurada (necessária para transcrever áudio).");
      }

      const res = await fetch(episode.audio_url, { signal: AbortSignal.timeout(120_000) });
      if (!res.ok) throw new Error(`Falha ao baixar o áudio (${res.status}).`);
      const contentLength = Number(res.headers.get("content-length") ?? 0);
      if (contentLength > MAX_AUDIO_BYTES) {
        throw new Error("Áudio maior que 25MB — limite da API Whisper. Envie um trecho menor.");
      }
      const buffer = await res.arrayBuffer();
      if (buffer.byteLength > MAX_AUDIO_BYTES) {
        throw new Error("Áudio maior que 25MB — limite da API Whisper. Envie um trecho menor.");
      }
      const { mime, filename } = inferMimeFromUrl(episode.audio_url);
      transcript = await transcribeAudio(buffer, openaiKey, mime, filename);
    }

    const { summary, tags } = await generateSummaryTags(transcript, process.env.OPENAI_API_KEY);

    const { error: upErr } = await admin
      .from("radio_episodes")
      .update({
        transcript_text: transcript,
        auto_summary: summary || null,
        auto_tags: tags.length > 0 ? tags : null,
        transcript_status: "done",
        transcript_error: null,
        transcript_updated_at: new Date().toISOString(),
      })
      .eq("id", episode_id);

    if (upErr) throw upErr;

    return NextResponse.json({ ok: true, summary, tags, hasTranscript: !!transcript });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao transcrever.";
    await admin
      .from("radio_episodes")
      .update({ transcript_status: "failed", transcript_error: msg, transcript_updated_at: new Date().toISOString() })
      .eq("id", episode_id);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}