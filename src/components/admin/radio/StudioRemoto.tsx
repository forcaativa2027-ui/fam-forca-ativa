"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Square, Check, Play, ImagePlus, Volume2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  uploadRadioRecording,
  uploadRadioCover,
  createRadioRecording,
  updateRadioRecording,
} from "@/services/radio";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useMyProfile } from "@/hooks/use-queries";

type StudioStatus = "idle" | "preparing" | "recording" | "review" | "saving" | "done" | "error";

function pickMimeType(): string {
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
  if (typeof MediaRecorder === "undefined") return "";
  for (const t of candidates) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return "";
}

export function StudioRemoto({ supabase, churchId }: { supabase: SupabaseClient; churchId: string | null }) {
  const { data: profile } = useMyProfile();
  const [status, setStatus] = useState<StudioStatus>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [title, setTitle] = useState("");
  const [speaker, setSpeaker] = useState("");
  const [gain, setGain] = useState(1);
  const [level, setLevel] = useState(0);
  const [error, setError] = useState("");
  const [publicUrl, setPublicUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const durationRef = useRef(0);
  const mimeRef = useRef<string>(pickMimeType());
  const ctxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      ctxRef.current?.close();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (coverPreview) URL.revokeObjectURL(coverPreview);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function reset() {
    setError("");
    setElapsed(0);
    setLevel(0);
    durationRef.current = 0;
  }

  async function start() {
    reset();
    setStatus("preparing");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;

      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      const source = ctx.createMediaStreamSource(stream);
      const gainNode = ctx.createGain();
      gainNode.gain.value = gain;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      const dest = ctx.createMediaStreamDestination();
      source.connect(gainNode);
      gainNode.connect(analyser);
      analyser.connect(dest);
      ctxRef.current = ctx;
      gainNodeRef.current = gainNode;
      analyserRef.current = analyser;

      const recorder = new MediaRecorder(dest.stream, mimeRef.current ? { mimeType: mimeRef.current } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = handleStop;
      recorder.start();
      mediaRef.current = recorder;

      setStatus("recording");
      setElapsed(0);
      timerRef.current = window.setInterval(() => {
        durationRef.current += 1;
        setElapsed((s) => s + 1);
      }, 1000);
      const tick = () => {
        const analyserNode = analyserRef.current;
        if (!analyserNode) return;
        const data = new Float32Array(analyserNode.fftSize);
        analyserNode.getFloatTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
        const rms = Math.sqrt(sum / data.length);
        setLevel(Math.min(100, Math.round(rms * 320)));
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch (e: unknown) {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      ctxRef.current?.close();
      setStatus("error");
      setError(e instanceof Error && e.name === "NotAllowedError"
        ? "Permissão de microfone negada. Habilite o acesso no navegador."
        : "Não foi possível acessar o microfone deste dispositivo.");
    }
  }

  function stop() {
    if (timerRef.current) window.clearInterval(timerRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    mediaRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    ctxRef.current?.close();
  }

  function handleStop() {
    const blob = new Blob(chunksRef.current, { type: mimeRef.current || "audio/webm" });
    if (blob.size < 1000) {
      setStatus("idle");
      return;
    }
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);
    setStatus("review");
  }

  function changeGain(value: number) {
    setGain(value);
    gainNodeRef.current?.gain.setValueAtTime(value, ctxRef.current?.currentTime ?? 0);
  }

  function pickCover(file: File | null) {
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverFile(file);
    setCoverPreview(file ? URL.createObjectURL(file) : null);
  }

  function discard() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setCoverPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setCoverFile(null);
    setCoverUrl("");
    setStatus("idle");
    reset();
  }

  async function publish() {
    setStatus("saving");
    setError("");
    try {
      const blob = new Blob(chunksRef.current, { type: mimeRef.current || "audio/webm" });
      const { publicUrl: url, path } = await uploadRadioRecording(supabase, blob, churchId, mimeRef.current);
      setPublicUrl(url);

      let cover: { path: string; publicUrl: string } | null = null;
      if (coverFile) {
        cover = await uploadRadioCover(supabase, coverFile, churchId);
        setCoverUrl(cover.publicUrl);
      }

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
        cover_url: cover?.publicUrl ?? null,
        cover_storage_path: cover?.path ?? null,
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
          <>
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm">
              <p className="flex items-center gap-2 font-semibold text-green-700">
                <Check className="h-4 w-4" /> Gravação publicada
              </p>
              {title && <p className="mt-1 text-green-700">{title}</p>}
              {coverUrl && (
                <img src={coverUrl} alt="Capa" className="mt-2 h-16 w-16 rounded object-cover" />
              )}
              {publicUrl && (
                <a className="mt-2 inline-block text-xs underline text-green-700" href={publicUrl} target="_blank" rel="noreferrer">
                  Ouvir gravação
                </a>
              )}
            </div>
            <Button onClick={discard} variant="outline" className="w-full">
              Nova gravação
            </Button>
          </>
        ) : status === "recording" ? (
          <>
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
              <p className="flex items-center justify-center gap-2 font-bold text-red-600">
                <MicOff className="h-4 w-4" /> Gravando · {fmt(elapsed)}
              </p>
              <div className="mx-auto mt-3 h-3 w-full max-w-xs overflow-hidden rounded-full bg-red-100">
                <div
                  className="h-full rounded-full bg-red-500 transition-[width] duration-100"
                  style={{ width: `${level}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-red-500">Nível do microfone: {level}%</p>
            </div>
            <div className="space-y-1">
              <Label className="flex items-center gap-1 text-xs">
                <Volume2 className="h-3 w-3" /> Ganho do microfone
              </Label>
              <input
                type="range"
                min={0}
                max={2}
                step={0.05}
                value={gain}
                onChange={(e) => changeGain(Number(e.target.value))}
                className="w-full"
              />
              <p className="text-right text-xs text-muted-foreground">{Math.round(gain * 100)}%</p>
            </div>
            <Button onClick={stop} className="w-full" variant="destructive">
              <Square className="mr-1 h-4 w-4" /> Parar e revisar
            </Button>
          </>
        ) : status === "review" ? (
          <>
            <div className="rounded-lg border border-border bg-muted p-3">
              {previewUrl && (
                <audio controls src={previewUrl} className="w-full" />
              )}
              <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                <Play className="h-3 w-3" /> Prévia da gravação — confira antes de publicar
              </p>
            </div>
            <div className="space-y-3">
              <div>
                <Label>Título da gravação</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Devocional da manhã" />
              </div>
              <div>
                <Label>Apresentador</Label>
                <Input value={speaker} onChange={(e) => setSpeaker(e.target.value)} placeholder="Ex: Pr. João Silva" />
              </div>
              <div>
                <Label>Foto de capa (opcional)</Label>
                <div className="flex items-center gap-3">
                  {coverPreview ? (
                    <img src={coverPreview} alt="Capa" className="h-16 w-16 rounded-lg border object-cover" />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed text-muted-foreground">
                      <ImagePlus className="h-5 w-5" />
                    </div>
                  )}
                  <div className="flex flex-1 gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => pickCover(e.target.files?.[0] ?? null)}
                    />
                    {coverFile && (
                      <Button type="button" variant="outline" size="icon" onClick={() => pickCover(null)} aria-label="Remover capa">
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={publish} disabled={status === "saving"} className="flex-1">
                  <Check className="mr-1 h-4 w-4" /> Publicar
                </Button>
                <Button onClick={discard} variant="outline" className="flex-1">
                  Descartar
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-3">
              <div>
                <Label>Título da gravação</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Devocional da manhã" />
              </div>
              <div>
                <Label>Apresentador</Label>
                <Input value={speaker} onChange={(e) => setSpeaker(e.target.value)} placeholder="Ex: Pr. João Silva" />
              </div>
              <div>
                <Label>Foto de capa (opcional)</Label>
                <div className="flex items-center gap-3">
                  {coverPreview ? (
                    <img src={coverPreview} alt="Capa" className="h-16 w-16 rounded-lg border object-cover" />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed text-muted-foreground">
                      <ImagePlus className="h-5 w-5" />
                    </div>
                  )}
                  <div className="flex flex-1 gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => pickCover(e.target.files?.[0] ?? null)}
                    />
                    {coverFile && (
                      <Button type="button" variant="outline" size="icon" onClick={() => pickCover(null)} aria-label="Remover capa">
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              <Button onClick={start} disabled={status === "preparing" || status === "saving"} className="w-full">
                <Mic className="mr-1 h-4 w-4" />
                {status === "preparing" ? "Aguardando microfone..." : status === "saving" ? "Enviando..." : "Começar gravação"}
              </Button>
            </div>
          </>
        )}
        {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
