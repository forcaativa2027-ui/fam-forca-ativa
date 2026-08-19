"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Square, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { uploadRadioRecording, createRadioRecording, updateRadioRecording } from "@/services/radio";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useMyProfile } from "@/hooks/use-queries";

export function StudioRemoto({ supabase, churchId }: { supabase: SupabaseClient; churchId: string | null }) {
  const { data: profile } = useMyProfile();
  const [recording, setRecording] = useState(false);
  const [status, setStatus] = useState<"idle" | "preparing" | "recording" | "saving" | "done" | "error">("idle");
  const [elapsed, setElapsed] = useState(0);
  const [title, setTitle] = useState("");
  const [speaker, setSpeaker] = useState("");
  const [error, setError] = useState("");
  const [publicUrl, setPublicUrl] = useState("");

  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const durationRef = useRef(0);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function start() {
    setError("");
    setStatus("preparing");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = handleStop;
      recorder.start();
      mediaRef.current = recorder;
      setRecording(true);
      setStatus("recording");
      setElapsed(0);
      durationRef.current = 0;
      timerRef.current = window.setInterval(() => {
        durationRef.current += 1;
        setElapsed((s) => s + 1);
      }, 1000);
    } catch (e: unknown) {
      setStatus("error");
      setError(e instanceof Error && e.name === "NotAllowedError"
        ? "Permissão de microfone negada. Habilite o acesso no navegador."
        : "Não foi possível acessar o microfone deste dispositivo.");
    }
  }

  function stop() {
    if (timerRef.current) window.clearInterval(timerRef.current);
    mediaRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setRecording(false);
  }

  async function handleStop() {
    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
    if (blob.size < 1000) {
      setStatus("idle");
      return;
    }
    setStatus("saving");
    try {
      const { publicUrl: url, path } = await uploadRadioRecording(supabase, blob, churchId);
      setPublicUrl(url);
      const finalTitle = title.trim() || `Gravação de ${new Date().toLocaleString("pt-BR")}`;
      const created = await createRadioRecording(supabase, {
        church_id: churchId,
        program_id: null,
        presenter_name: speaker.trim() || profile?.full_name || null,
        title: finalTitle,
      });
      await updateRadioRecording(supabase, created.id, {
        status: "revisao",
        audio_url: url,
        duration_seconds: durationRef.current,
        storage_path: path,
      });
      setStatus("done");
    } catch (e: unknown) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Erro ao enviar a gravação para o armazenamento.");
    }
  }

  function fmt(sec: number) {
    const m = String(Math.floor(sec / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    return `${m}:${s}`;
  }

  return (
    <Card className="rounded-xl border border-border p-6">
      <CardHeader>
        <CardTitle>Studio Remoto</CardTitle>
        <CardDescription>Grave ao vivo pelo microfone e publique como conteúdo da rádio</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {status === "done" ? (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm">
            <p className="flex items-center gap-2 font-semibold text-green-700">
              <Check className="h-4 w-4" /> Gravação publicada
            </p>
            {title && <p className="mt-1 text-green-700">{title}</p>}
            {publicUrl && (
              <a className="mt-2 inline-block text-xs underline text-green-700" href={publicUrl} target="_blank" rel="noreferrer">
                Ouvir gravação
              </a>
            )}
          </div>
        ) : status === "recording" ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
            <p className="flex items-center justify-center gap-2 font-bold text-red-600">
              <MicOff className="h-4 w-4" /> Gravando · {fmt(elapsed)}
            </p>
            <Button onClick={stop} className="mt-3" variant="destructive">
              <Square className="mr-1 h-4 w-4" /> Parar e publicar
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <Label>Título da gravação</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Devocional da manhã" />
            </div>
            <div>
              <Label>Apresentador</Label>
              <Input value={speaker} onChange={(e) => setSpeaker(e.target.value)} placeholder="Ex: Pr. João Silva" />
            </div>
            <Button onClick={start} disabled={status === "preparing" || status === "saving"} className="w-full">
              <Mic className="mr-1 h-4 w-4" />
              {status === "preparing" ? "Aguardando microfone..." : status === "saving" ? "Enviando..." : "Começar gravação"}
            </Button>
          </div>
        )}
        {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}