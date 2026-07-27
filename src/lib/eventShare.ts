import type { RegistrationEvent } from "@/types/domain";

/** URL pública amigável do evento (ex: https://cecfamily.vercel.app/eventos/congresso-2026) */
export function eventPublicUrl(event: Pick<RegistrationEvent, "slug">): string {
  const base = typeof window !== "undefined" ? window.location.origin : "";
  return `${base}/eventos/${event.slug}`;
}

/** Número de protocolo curto e legível a partir do id da inscrição (sem precisar de coluna nova no banco). */
export function registrationProtocol(registrationId: string): string {
  return registrationId.replace(/-/g, "").slice(0, 8).toUpperCase();
}

function toIcsDate(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

/** Link do Google Calendar (abre em nova aba, sem precisar gerar arquivo). */
export function googleCalendarUrl(event: RegistrationEvent): string {
  const start = toIcsDate(event.start_at);
  const end = toIcsDate(event.end_at ?? new Date(new Date(event.start_at).getTime() + 2 * 60 * 60 * 1000).toISOString());
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.name,
    dates: `${start}/${end}`,
    details: event.description ?? "",
    location: event.is_online ? (event.online_url ?? "Online") : (event.location ?? ""),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Arquivo .ics pra quem não usa Google Calendar (Apple/Outlook). Retorna uma data: URL pronta pra download. */
export function icsDownloadUrl(event: RegistrationEvent): string {
  const start = toIcsDate(event.start_at);
  const end = toIcsDate(event.end_at ?? new Date(new Date(event.start_at).getTime() + 2 * 60 * 60 * 1000).toISOString());
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "BEGIN:VEVENT",
    `UID:${event.id}@cecfamily`,
    `DTSTART:${start}`, `DTEND:${end}`,
    `SUMMARY:${event.name.replace(/\n/g, " ")}`,
    `DESCRIPTION:${(event.description ?? "").replace(/\n/g, "\\n")}`,
    `LOCATION:${event.is_online ? (event.online_url ?? "Online") : (event.location ?? "")}`,
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
}

/** QR Code de check-in da inscrição — mesmo padrão usado na Carteira CEC ID (api.qrserver.com). */
export function eventCheckinQrUrl(registrationId: string): string {
  const base = typeof window !== "undefined" ? window.location.origin : "https://cec-painel.vercel.app";
  const validationUrl = `${base}/checkin/${registrationId}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(validationUrl)}`;
}
export function extractRegistrationIdFromQr(raw: string): string {
  const trimmed = raw.trim();
  const match = trimmed.match(/\/checkin\/([A-Za-z0-9-]+)/);
  return match ? match[1] : trimmed;
}

export function whatsappShareUrl(event: RegistrationEvent): string {
  const text = `${event.name}\n${new Date(event.start_at).toLocaleString("pt-BR", { dateStyle: "long", timeStyle: "short" })}\n${eventPublicUrl(event)}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export async function copyEventLink(event: Pick<RegistrationEvent, "slug">): Promise<void> {
  await navigator.clipboard.writeText(eventPublicUrl(event));
}

export function canNativeShare(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}

export async function nativeShareEvent(event: RegistrationEvent): Promise<void> {
  await navigator.share({ title: event.name, text: event.name, url: eventPublicUrl(event) });
}
