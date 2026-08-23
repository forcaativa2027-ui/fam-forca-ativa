"use client";

import { useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useValidatedInvite, useRadioPrograms } from "@/hooks/use-queries";
import { useRadioPlayer } from "@/components/radio/RadioPlayerContext";
import { supabase } from "@/lib/supabase/client";
import { uploadRadioRecording, useInviteToken } from "@/services/radio";
import { Mic, MicOff, Square, Check, AlertTriangle } from "lucide-react";

export function StudioInvitePage() {
  const params = useParams<{ token: string }>();
  const token = params?.token ?? "";
  const { data: validation, isLoading } = useValidatedInvite(token);
  const [phase, setPhase] = useState<"idle" | "preparing" | "recording" | "saving" | "done" | "error">("idle");
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");
  const [micOk, setMicOk] = useState<boolean | null>(null);

  const player = useRadioPlayer();

  const programs = useRadioPrograms(validation?.church_id ?? null);
  const program = programs.data?.find((p) => p.id === validation?.program_id);

  const now = useMemo(() => new Date(), []);
  const canTransmit = useMemo(() => {
    if (!validation?.valid || !validation.starts_at) return false;
    return new Date(validation.starts_at) <= now;
  }, [validation, now]);

  const timeToStart = useMemo(() => {
    if (!validation?.starts_at) return null;
    const diff = new Date(validation.starts_at).getTime() - now.getTime();
    if (diff <= 0) return null;
    const m = Math.floor(diff / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }, [validation, now]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);

  async function testMicrophone() {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      s.getTracks().forEach((t) => t.stop());
      setMicOk(true);
    } catch {
      setMicOk(false);
    }
  }

  async function startRecording() {
    if (!validation) return;
    setError("");
    setPhase("preparing");
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = s;
      const recorder = new MediaRecorder(s, { mimeType: "audio/webm" });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        await finishRecording(blob);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setPhase("recording");
      setElapsed(0);
      timerRef.current = window.setInterval(() => setElapsed((x) => x + 1), 1000);
      await useInviteToken(supabase, token);
    } catch (e: unknown) {
      setPhase("error");
      setError(e instanceof Error && e.name === "NotAllowedError"
        ? "Permissão de microfone negada."
        : "Não foi possível acessar o microfone.");
    }
  }

  async function stopRecording() {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setPhase("saving");
  }

  async function finishRecording(blob: Blob) {
    if (!validation) return;
    setPhase("saving");
    try {
      const { publicUrl } = await uploadRadioRecording(supabase, blob, validation.church_id ?? null);
      await player.playEpisode(publicUrl, validation.program_title ?? "Gravação de estúdio");
      setPhase("done");
    } catch (e: unknown) {
      setPhase("error");
      setError(e instanceof Error ? e.message : "Erro ao enviar gravação.");
    }
  }

  function fmt(sec: number) {
    return `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
  }

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-muted">Validando convite...</div>;
  }

  if (!validation?.valid) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-xl border border-red-200 bg-red-50 p-8 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-red-500" />
          <h1 className="mt-4 font-display text-xl font-bold text-navy">Convite inválido</h1>
          <p className="mt-2 text-sm text-muted">{validation?.reason ?? "Este convite não existe, foi revogado ou expirou."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-10">
      <div className="container mx-auto max-w-2xl">
        <div className="rounded-xl border border-gold/30 bg-card p-8">
          <p className="text-xs font-bold uppercase tracking-wide text-gold">Servo360 Radio Studio</p>
          <h1 className="mt-1 font-display text-2xl font-bold text-navy">{validation.program_title ?? "Programa"}</h1>
          <p className="mt-1 text-sm text-muted">
            {validation.presenter_name ? `Apresentador: ${validation.presenter_name}` : "Apresentador convidado"}
          </p>
          {program?.start_time && program?.end_time && (
            <p className="mt-1 text-xs text-muted">
              Hoje · {program.start_time.slice(0, 5)}–{program.end_time.slice(0, 5)}
            </p>
          )}

          <div className="mt-6 space-y-4">
            {/* Teste de microfone */}
            <div className="rounded-lg border border-border p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-navy">🎙 Microfone</p>
                  <p className="text-xs text-muted">
                    {micOk === null ? "Toque em testar para verificar o dispositivo." : micOk ? "OK" : "Sem acesso — verifique as permissões do navegador."}
                  </p>
                </div>
                <button
                  onClick={testMicrophone}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${micOk ? "bg-emerald-500 text-white" : "border border-gold/30 text-navy hover:bg-gold/10"}`}
                >
                  {micOk ? <Check className="inline h-3 w-3 mr-1" /> : null}
                  Testar
                </button>
              </div>
            </div>

            {/* Estado da janela */}
            {!canTransmit && timeToStart && (
              <div className="rounded-lg bg-navy/5 border border-navy/10 p-4 text-center">
                <p className="text-sm font-bold text-navy">Início em {timeToStart}</p>
                <p className="text-xs text-muted">A transmissão será liberada no horário agendado.</p>
              </div>
            )}

            {/* Gravação */}
            {phase === "done" ? (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm">
                <p className="flex items-center gap-2 font-semibold text-green-700"><Check className="h-4 w-4" /> Gravação enviada ao estúdio</p>
                <p className="mt-1 text-xs text-green-700">O conteúdo estará disponível na biblioteca para revisão e reprise.</p>
              </div>
            ) : phase === "recording" ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
                <p className="flex items-center justify-center gap-2 font-bold text-red-600">
                  <MicOff className="h-4 w-4" /> REC · {fmt(elapsed)}
                </p>
                <button onClick={stopRecording} className="mt-3 inline-flex items-center gap-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white">
                  <Square className="h-3 w-3" /> Parar e enviar
                </button>
              </div>
            ) : phase === "saving" || phase === "preparing" ? (
              <div className="rounded-lg bg-muted p-4 text-center text-sm text-muted">
                {phase === "preparing" ? "Preparando microfone..." : "Enviando gravação..."}
              </div>
            ) : (
              <button
                onClick={startRecording}
                disabled={!canTransmit}
                className="w-full rounded-xl bg-gold py-3 font-display text-lg font-bold text-navy transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Mic className="mr-2 inline h-5 w-5" />
                {canTransmit ? "Entrar no estúdio e transmitir" : "Aguardando janela autorizada"}
              </button>
            )}

            {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}