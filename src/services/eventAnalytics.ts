import type { SupabaseClient } from "@supabase/supabase-js";

export type EventAnalyticsKind = "view" | "click_inscrever";

export interface EventFunnel {
  views: number;
  unique_sessions: number;
  clicks: number;
  inscricoes_confirmadas: number;
  inscricoes_lista_espera: number;
  inscricoes_canceladas: number;
  conversao_pct: number;
}

export interface EventAnalyticsByOrigin {
  origin: string;
  views: number;
  clicks: number;
}

const SESSION_KEY = "cec-analytics-session";

/** Id anônimo estável no navegador (não é identificação pessoal, só pra estimar "visitantes únicos"). */
function getSessionId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch { return null; }
}

export async function logEventView(sb: SupabaseClient, eventId: string, origin?: string | null): Promise<void> {
  try {
    await sb.rpc("log_event_analytics", { p_event_id: eventId, p_kind: "view", p_origin: origin ?? null, p_session_id: getSessionId() });
  } catch { /* analytics nunca deve travar a experiência do usuário */ }
}

export async function logEventClick(sb: SupabaseClient, eventId: string, origin?: string | null): Promise<void> {
  try {
    await sb.rpc("log_event_analytics", { p_event_id: eventId, p_kind: "click_inscrever", p_origin: origin ?? null, p_session_id: getSessionId() });
  } catch { /* idem */ }
}

export async function getEventFunnel(sb: SupabaseClient, eventId: string): Promise<EventFunnel | null> {
  const { data, error } = await sb.rpc("get_event_funnel", { p_event_id: eventId }).single();
  if (error) return null;
  return data as EventFunnel;
}

export async function getEventAnalyticsByOrigin(sb: SupabaseClient, eventId: string): Promise<EventAnalyticsByOrigin[]> {
  const { data, error } = await sb.rpc("get_event_analytics_by_origin", { p_event_id: eventId });
  if (error) return [];
  return (data ?? []) as EventAnalyticsByOrigin[];
}
