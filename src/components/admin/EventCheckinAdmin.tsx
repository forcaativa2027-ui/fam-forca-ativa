"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Camera, CameraOff, Search, CheckCircle2, XCircle, AlertTriangle, Ticket, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRegistrationEventsAdmin, useRecentEventCheckins } from "@/hooks/use-queries";
import { supabase } from "@/lib/supabase/client";
import * as Ev from "@/services/events";
import { extractRegistrationIdFromQr } from "@/lib/eventShare";
import type { EventCheckinLookup, EventGroupMember } from "@/types/domain";

export function EventCheckinAdmin() {
  const { data: events = [] } = useRegistrationEventsAdmin();
  const [eventId, setEventId] = useState("");

  if (!eventId) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-8">
        <div className="text-center">
          <Ticket className="mx-auto h-10 w-10 text-gold" />
          <h2 className="mt-2 font-display text-2xl text-navy">Check-in de Evento</h2>
          <p className="text-sm text-muted-foreground">Escolha o evento antes de começar a registrar presenças.</p>
        </div>
        <div>
          <Label>Evento</Label>
          <select value={eventId} onChange={(e) => setEventId(e.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
            <option value="">Selecione um evento…</option>
            {events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
      </div>
    );
  }

  const event = events.find((e) => e.id === eventId);
  return <CheckinScanner eventId={eventId} eventName={event?.name ?? ""} onChangeEvent={() => setEventId("")} />;
}

export function CheckinScanner({
  eventId, eventName, onChangeEvent, embedded = false,
}: { eventId: string; eventName: string; onChangeEvent: () => void; embedded?: boolean }) {
  const qc = useQueryClient();
  const [manualQuery, setManualQuery] = useState("");
  const [searchResults, setSearchResults] = useState<EventGroupMember[] | null>(null);
  const [result, setResult] = useState<EventCheckinLookup | null>(null);
  const [groupMembers, setGroupMembers] = useState<EventGroupMember[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanSupported, setScanSupported] = useState<boolean | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  const { data: recent = [] } = useRecentEventCheckins(eventId);

  useEffect(() => {
    setScanSupported(typeof window !== "undefined" && "BarcodeDetector" in window);
  }, []);

  const stopScan = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanning(false);
  }, []);

  useEffect(() => () => stopScan(), [stopScan]);

  async function openResult(registrationId: string) {
    setErr(""); setResult(null); setNotFound(false); setGroupMembers([]); setBusy(true);
    try {
      const found = await Ev.lookupEventRegistrationForCheckin(supabase, registrationId);
      if (!found) { setNotFound(true); return; }
      if (found.event_id !== eventId) {
        setErr(`Esta inscrição é de outro evento ("${found.event_name}"), não de "${eventName}".`);
        return;
      }
      setResult(found);
      setSearchResults(null);
      if (found.group_id) {
        const members = await Ev.listGroupRegistrations(supabase, found.group_id);
        setGroupMembers(members);
      }
    } catch (e) { setErr(e instanceof Error ? e.message : "Erro ao buscar inscrição"); }
    finally { setBusy(false); }
  }

  async function startScan() {
    setErr("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScanning(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Detector = (window as any).BarcodeDetector;
      const detector = new Detector({ formats: ["qr_code"] });

      const tick = async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) {
          rafRef.current = requestAnimationFrame(tick);
          return;
        }
        try {
          const codes = await detector.detect(videoRef.current);
          if (codes.length > 0) {
            stopScan();
            await openResult(extractRegistrationIdFromQr(codes[0].rawValue as string));
            return;
          }
        } catch { /* segue tentando */ }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      setErr("Não foi possível acessar a câmera. Use a busca manual abaixo.");
      setScanning(false);
    }
  }

  async function handleManualSearch() {
    if (!manualQuery.trim()) return;
    setErr(""); setNotFound(false); setBusy(true);
    try {
      const found = await Ev.searchEventRegistrations(supabase, eventId, manualQuery.trim());
      if (found.length === 0) setNotFound(true);
      setSearchResults(found);
    } catch (e) { setErr(e instanceof Error ? e.message : "Erro ao buscar"); }
    finally { setBusy(false); }
  }

  async function confirmCheckin() {
    if (!result) return;
    setBusy(true); setErr("");
    try {
      await Ev.checkinEventRegistration(supabase, result.registration_id);
      qc.invalidateQueries({ queryKey: ["event-recent-checkins", eventId] });
      setResult(null); setManualQuery(""); setSearchResults(null); setGroupMembers([]);
    } catch (e) { setErr(e instanceof Error ? e.message : "Erro ao registrar check-in"); }
    finally { setBusy(false); }
  }

  async function confirmGroupCheckin() {
    if (!result?.group_id) return;
    setBusy(true); setErr("");
    try {
      const count = await Ev.checkinEventGroup(supabase, result.group_id);
      qc.invalidateQueries({ queryKey: ["event-recent-checkins", eventId] });
      alert(`Check-in registrado para ${count} pessoa(s) do grupo.`);
      setResult(null); setManualQuery(""); setSearchResults(null); setGroupMembers([]);
    } catch (e) { setErr(e instanceof Error ? e.message : "Erro ao registrar check-in do grupo"); }
    finally { setBusy(false); }
  }

  return (
    <div className="mx-auto max-w-md space-y-4 py-4">
      {!embedded && (
        <div className="flex items-center justify-between rounded-md border bg-muted/30 p-2 text-sm">
          <span className="font-semibold text-navy">{eventName}</span>
          <Button variant="outline" size="sm" onClick={() => { stopScan(); onChangeEvent(); }}>Trocar evento</Button>
        </div>
      )}

      {!result && !notFound && !searchResults && (
        <>
          {scanSupported && (
            <div className="space-y-2">
              {!scanning ? (
                <Button className="w-full gap-2" onClick={startScan}><Camera className="h-4 w-4" />Escanear QR Code</Button>
              ) : (
                <div className="space-y-2">
                  <video ref={videoRef} className="w-full rounded-lg border" muted playsInline />
                  <Button variant="outline" className="w-full gap-2" onClick={stopScan}><CameraOff className="h-4 w-4" />Parar câmera</Button>
                </div>
              )}
            </div>
          )}
          {scanSupported === false && (
            <p className="flex items-center gap-1.5 rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-800">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />Este navegador não suporta leitura de QR pela câmera. Use a busca manual abaixo.
            </p>
          )}

          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-border" /><span className="text-xs text-muted-foreground">ou</span><div className="h-px flex-1 bg-border" />
          </div>

          <div className="space-y-2">
            <Label>Buscar por nome, e-mail ou telefone</Label>
            <div className="flex gap-2">
              <Input placeholder="Nome do inscrito" value={manualQuery} onChange={(e) => setManualQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleManualSearch()} />
              <Button onClick={handleManualSearch} disabled={busy || !manualQuery.trim()} className="gap-1.5 shrink-0"><Search className="h-4 w-4" />Buscar</Button>
            </div>
          </div>
        </>
      )}

      {err && <p className="text-sm text-destructive">{err}</p>}

      {searchResults && searchResults.length > 0 && (
        <div className="space-y-1.5">
          {searchResults.map((r) => (
            <button
              key={r.registration_id}
              onClick={() => openResult(r.registration_id)}
              className="flex w-full items-center justify-between rounded-md border bg-card p-2.5 text-left text-sm hover:bg-muted/40"
            >
              <span>{r.full_name}</span>
              {r.checked_in_at
                ? <span className="text-xs text-emerald-600">já entrou</span>
                : <span className="text-xs text-muted-foreground">{r.status === "lista_espera" ? "lista de espera" : "confirmada"}</span>}
            </button>
          ))}
          <Button variant="ghost" size="sm" onClick={() => { setSearchResults(null); setManualQuery(""); }}>Nova busca</Button>
        </div>
      )}

      {notFound && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
          <XCircle className="mx-auto h-8 w-8 text-red-500" />
          <p className="mt-1 font-semibold text-red-700">Nenhuma inscrição encontrada</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => { setNotFound(false); setSearchResults(null); }}>Tentar de novo</Button>
        </div>
      )}

      {result && (
        <div className="rounded-lg border bg-card p-4">
          <p className="font-display text-lg font-bold text-navy">{result.full_name}</p>
          <p className="text-xs text-muted-foreground">{[result.email, result.phone].filter(Boolean).join(" · ") || "Sem contato informado"}</p>

          <span className={`mt-2 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-bold ${
            result.status === "confirmada" ? "border-emerald-300 bg-emerald-50 text-emerald-700"
            : result.status === "lista_espera" ? "border-amber-300 bg-amber-50 text-amber-700"
            : "border-red-300 bg-red-50 text-red-700"
          }`}>
            {result.status === "confirmada" ? "Confirmada" : result.status === "lista_espera" ? "Lista de espera" : "Cancelada"}
          </span>

          {result.checked_in_at ? (
            <p className="mt-2 flex items-center gap-1.5 rounded-md border border-emerald-300 bg-emerald-50 p-2 text-xs text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />Check-in já feito às {new Date(result.checked_in_at).toLocaleTimeString("pt-BR")}
            </p>
          ) : result.status === "cancelada" ? (
            <p className="mt-2 flex items-center gap-1.5 rounded-md border border-red-300 bg-red-50 p-2 text-xs text-red-700">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />Inscrição cancelada — não é possível fazer check-in.
            </p>
          ) : null}

          {groupMembers.length > 1 && (
            <div className="mt-3 rounded-md border p-2">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase text-muted-foreground"><Users className="h-3.5 w-3.5" />Grupo/família ({groupMembers.length})</p>
              <ul className="space-y-1 text-xs">
                {groupMembers.map((m) => (
                  <li key={m.registration_id} className="flex items-center justify-between">
                    <span>{m.full_name}</span>
                    {m.checked_in_at ? <span className="text-emerald-600">✓ entrou</span> : <span className="text-muted-foreground">pendente</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-3 flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => { setResult(null); setGroupMembers([]); }}>Cancelar</Button>
            {!result.checked_in_at && result.status !== "cancelada" && (
              <Button className="flex-1 gap-1.5" disabled={busy} onClick={confirmCheckin}>
                <CheckCircle2 className="h-4 w-4" />{busy ? "Registrando…" : "Confirmar Check-in"}
              </Button>
            )}
          </div>
          {groupMembers.length > 1 && result.status !== "cancelada" && (
            <Button variant="navy" className="mt-2 w-full gap-1.5" disabled={busy} onClick={confirmGroupCheckin}>
              <Users className="h-4 w-4" />Check-in de todo o grupo ({groupMembers.length})
            </Button>
          )}
        </div>
      )}

      <div>
        <p className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-navy-600">
          <Clock className="h-3.5 w-3.5" />Últimas entradas
        </p>
        {recent.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhum check-in registrado ainda pra este evento.</p>
        ) : (
          <ul className="divide-y rounded-md border text-sm">
            {recent.map((c) => (
              <li key={c.registration_id} className="flex items-center justify-between px-3 py-1.5">
                <span>{c.full_name}</span>
                <span className="text-xs text-muted-foreground">{new Date(c.checked_in_at).toLocaleTimeString("pt-BR")}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
