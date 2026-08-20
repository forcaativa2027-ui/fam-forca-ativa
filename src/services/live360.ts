import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  LiveSession, LiveCurrentItem, LiveControlTokenResult, LiveTokenValidation,
  LiveLyric, LiveOnairLyric, LiveLyricBlock,
} from "@/types/domain";

export async function startLiveSession(sb: SupabaseClient, churchId: string, title?: string): Promise<LiveSession> {
  const { data, error } = await sb.rpc("live_start_session", { p_church_id: churchId, p_title: title ?? "Sessão ao vivo" });
  if (error) throw error;
  return (Array.isArray(data) ? data[0] : data) as LiveSession;
}

export async function listLiveSessions(sb: SupabaseClient, churchId: string): Promise<LiveSession[]> {
  const { data, error } = await sb.from("live_sessions")
    .select("*")
    .eq("church_id", churchId)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return (data ?? []) as LiveSession[];
}

export async function getLiveCurrent(sb: SupabaseClient, sessionId: string): Promise<Omit<LiveCurrentItem, "session_id"> | null> {
  const { data, error } = await sb.rpc("live_get_current", { p_session_id: sessionId });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return (row ?? null) as Omit<LiveCurrentItem, "session_id"> | null;
}

export async function applyLiveCommand(
  sb: SupabaseClient,
  params: {
    sessionId: string;
    cmd: string;
    kind: LiveCurrentItem["kind"];
    ref?: string | null;
    payload?: Record<string, unknown>;
    token?: string;
    clientId?: string;
  }
): Promise<LiveCurrentItem> {
  const { data, error } = await sb.rpc("live_apply_command", {
    p_session_id: params.sessionId,
    p_cmd: params.cmd,
    p_kind: params.kind,
    p_ref: params.ref ?? null,
    p_payload: params.payload ?? {},
    p_token: params.token ?? null,
    p_client_id: params.clientId ?? null,
  });
  if (error) throw error;
  return (Array.isArray(data) ? data[0] : data) as LiveCurrentItem;
}

export async function createLiveControlToken(
  sb: SupabaseClient,
  sessionId: string,
  role: "operator" | "viewer" = "operator",
  expiresInHours = 2
): Promise<LiveControlTokenResult> {
  const { data, error } = await sb.rpc("live_create_control_token", {
    p_session_id: sessionId,
    p_role: role,
    p_expires_in: `${expiresInHours} hours`,
  });
  if (error) throw error;
  return (Array.isArray(data) ? data[0] : data) as LiveControlTokenResult;
}

export async function validateLiveToken(sb: SupabaseClient, sessionId: string, token: string): Promise<LiveTokenValidation> {
  const { data, error } = await sb.rpc("live_validate_token", { p_session_id: sessionId, p_token: token });
  if (error) throw error;
  return (Array.isArray(data) ? data[0] : data) as LiveTokenValidation;
}

export async function freezeLiveSession(sb: SupabaseClient, sessionId: string, frozen: boolean): Promise<void> {
  const { error } = await sb.rpc("live_freeze", { p_session_id: sessionId, p_frozen: frozen });
  if (error) throw error;
}

// ── Repertório de louvor (Slice 2) ──
export async function listLiveLyrics(sb: SupabaseClient, churchId: string, search?: string): Promise<LiveLyric[]> {
  const { data, error } = await sb.rpc("live_list_lyrics", {
    p_church_id: churchId,
    p_search: search ?? null,
  });
  if (error) throw error;
  return (data ?? []) as LiveLyric[];
}

export async function saveLiveLyric(
  sb: SupabaseClient,
  params: {
    id?: string | null;
    churchId: string;
    title: string;
    author?: string | null;
    lyrics: LiveLyricBlock[];
    tags?: string[];
  }
): Promise<LiveLyric> {
  const { data, error } = await sb.rpc("live_save_lyric", {
    p_id: params.id ?? null,
    p_church_id: params.churchId,
    p_title: params.title,
    p_author: params.author ?? null,
    p_lyrics: params.lyrics,
    p_tags: params.tags ?? [],
  });
  if (error) throw error;
  return (Array.isArray(data) ? data[0] : data) as LiveLyric;
}

export async function deleteLiveLyric(sb: SupabaseClient, id: string): Promise<void> {
  const { error } = await sb.rpc("live_delete_lyric", { p_id: id });
  if (error) throw error;
}

export async function getLiveOnairLyric(sb: SupabaseClient, sessionId: string): Promise<LiveOnairLyric | null> {
  const { data, error } = await sb.rpc("live_get_onair_lyric", { p_session_id: sessionId });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return (row ?? null) as LiveOnairLyric | null;
}

export async function listLiveLyricsByToken(sb: SupabaseClient, sessionId: string, token: string): Promise<LiveLyric[]> {
  const { data, error } = await sb.rpc("live_list_lyrics_by_token", {
    p_session_id: sessionId,
    p_token: token,
  });
  if (error) throw error;
  return (data ?? []) as LiveLyric[];
}
