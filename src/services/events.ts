import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  RegistrationEvent, RegistrationEventInput, EventRegistration, EventRegistrationSummary,
  RegisterForEventResult, MyEventRegistration, GroupRegistrationResult,
  EventCheckinLookup, EventGroupMember, RecentEventCheckin, EventSpeaker, PendingPromotion, EventChange, EventFeedbackSummary,
} from "@/types/domain";

const PUBLIC_VISIBLE_STATUSES = [
  "agendado", "inscricoes_abertas", "inscricoes_encerradas", "lotado", "em_andamento", "finalizado", "cancelado",
] as const;

// ---------- Público ----------
export async function listPublicRegistrationEvents(sb: SupabaseClient, churchId?: string | null): Promise<RegistrationEvent[]> {
  // Regra combinada:
  //  - church_id nulo         → evento nacional/rede, visível pra todo mundo.
  //  - church_id de uma Sede  → visível pra todo mundo (Sede não é "só mais uma igreja").
  //  - church_id de igreja local (não-Sede) → visível só pra quem é dessa igreja.
  const { data: sedes } = await sb.from("churches").select("id").eq("type", "sede");
  const sedeIds = (sedes ?? []).map((s: { id: string }) => s.id);
  const visibleIds = new Set<string>(sedeIds);
  if (churchId) visibleIds.add(churchId);

  let q = sb.from("registration_events").select("*").in("status", PUBLIC_VISIBLE_STATUSES).order("start_at", { ascending: true });
  q = visibleIds.size > 0
    ? q.or(`church_id.is.null,church_id.in.(${Array.from(visibleIds).join(",")})`)
    : q.is("church_id", null);

  const { data, error } = await q;
  if (error) return [];
  return (data ?? []) as RegistrationEvent[];
}

export async function getRegistrationEventBySlug(sb: SupabaseClient, slug: string): Promise<RegistrationEvent | null> {
  const { data, error } = await sb.from("registration_events").select("*").eq("slug", slug).maybeSingle();
  if (error) return null;
  return data as RegistrationEvent | null;
}

export interface RegisterOptions {
  cpf?: string | null;
  acceptedPrivacyPolicy: boolean;
  acceptedImageUse?: boolean;
  customAnswers?: Record<string, unknown>;
}

export async function registerForEvent(
  sb: SupabaseClient, eventId: string, fullName: string, email: string | null | undefined,
  phone: string | null | undefined, options: RegisterOptions
): Promise<RegisterForEventResult> {
  const { data, error } = await sb.rpc("register_for_event", {
    p_event_id: eventId, p_full_name: fullName, p_email: email ?? null, p_phone: phone ?? null,
    p_cpf: options.cpf ?? null,
    p_accepted_privacy_policy: options.acceptedPrivacyPolicy,
    p_accepted_image_use: options.acceptedImageUse ?? false,
    p_custom_answers: options.customAnswers ?? {},
  }).single();
  if (error) throw error;
  return data as RegisterForEventResult;
}

export interface GroupParticipantInput {
  full_name: string;
  email?: string | null;
  phone?: string | null;
  cpf?: string | null;
  custom_answers?: Record<string, unknown>;
}

export async function registerGroupForEvent(
  sb: SupabaseClient, eventId: string, participants: GroupParticipantInput[], options: RegisterOptions
): Promise<GroupRegistrationResult[]> {
  const { data, error } = await sb.rpc("register_group_for_event", {
    p_event_id: eventId,
    p_participants: participants,
    p_accepted_privacy_policy: options.acceptedPrivacyPolicy,
    p_accepted_image_use: options.acceptedImageUse ?? false,
  });
  if (error) throw error;
  return (data ?? []) as GroupRegistrationResult[];
}

export async function cancelRegistration(sb: SupabaseClient, registrationId: string): Promise<void> {
  const { error } = await sb.rpc("cancel_event_registration", { p_registration_id: registrationId });
  if (error) throw error;
}

export async function listMyEventRegistrations(sb: SupabaseClient): Promise<MyEventRegistration[]> {
  const { data, error } = await sb
    .from("event_registrations")
    .select("*, event:registration_events(*)")
    .order("registered_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as unknown as MyEventRegistration[];
}

// ---------- Admin ----------
export async function listRegistrationEventsAdmin(sb: SupabaseClient): Promise<RegistrationEvent[]> {
  const { data, error } = await sb.from("registration_events").select("*").order("start_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as RegistrationEvent[];
}

export async function getRegistrationEventAdmin(sb: SupabaseClient, id: string): Promise<RegistrationEvent | null> {
  const { data, error } = await sb.from("registration_events").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as RegistrationEvent | null;
}

export async function createRegistrationEvent(sb: SupabaseClient, input: RegistrationEventInput): Promise<RegistrationEvent> {
  const { data: { user } } = await sb.auth.getUser();
  const { data, error } = await sb.from("registration_events").insert({ ...input, created_by: user?.id ?? null }).select().single();
  if (error) throw error;
  return data as RegistrationEvent;
}

export async function updateRegistrationEvent(sb: SupabaseClient, id: string, input: RegistrationEventInput): Promise<RegistrationEvent> {
  const { data, error } = await sb.from("registration_events").update(input).eq("id", id).select().single();
  if (error) throw error;
  return data as RegistrationEvent;
}

export async function listHighlightedRegistrationEvents(sb: SupabaseClient): Promise<RegistrationEvent[]> {
  const { data, error } = await sb.from("registration_events").select("*")
    .eq("highlight_dashboard", true)
    .in("status", ["agendado", "inscricoes_abertas", "em_andamento"])
    .order("start_at", { ascending: true })
    .limit(5);
  if (error) return [];
  return (data ?? []) as RegistrationEvent[];
}

export async function deleteRegistrationEvent(sb: SupabaseClient, id: string): Promise<void> {
  const { error } = await sb.from("registration_events").delete().eq("id", id);
  if (error) throw error;
}

export async function listEventRegistrations(sb: SupabaseClient, eventId: string): Promise<EventRegistration[]> {
  const { data, error } = await sb.from("event_registrations").select("*").eq("event_id", eventId).order("registered_at");
  if (error) throw error;
  return (data ?? []) as EventRegistration[];
}

export async function getRegistrationSummary(sb: SupabaseClient, eventId: string): Promise<EventRegistrationSummary | null> {
  const { data, error } = await sb.rpc("event_registration_summary", { p_event_id: eventId }).maybeSingle();
  if (error) throw error;
  return data as EventRegistrationSummary | null;
}

// ---------- Check-in (EVT005) ----------
export async function lookupEventRegistrationForCheckin(sb: SupabaseClient, registrationId: string): Promise<EventCheckinLookup | null> {
  const { data, error } = await sb.rpc("lookup_event_registration_for_checkin", { p_registration_id: registrationId }).maybeSingle();
  if (error) throw error;
  return data as EventCheckinLookup | null;
}

export async function searchEventRegistrations(sb: SupabaseClient, eventId: string, query: string): Promise<EventGroupMember[]> {
  const { data, error } = await sb.rpc("search_event_registrations", { p_event_id: eventId, p_query: query });
  if (error) throw error;
  return (data ?? []) as EventGroupMember[];
}

export async function listGroupRegistrations(sb: SupabaseClient, groupId: string): Promise<EventGroupMember[]> {
  const { data, error } = await sb.rpc("list_group_registrations", { p_group_id: groupId });
  if (error) throw error;
  return (data ?? []) as EventGroupMember[];
}

export async function checkinEventRegistration(sb: SupabaseClient, registrationId: string): Promise<string> {
  const { data, error } = await sb.rpc("checkin_event_registration", { p_registration_id: registrationId });
  if (error) throw error;
  return data as string;
}

export async function checkinEventGroup(sb: SupabaseClient, groupId: string): Promise<number> {
  const { data, error } = await sb.rpc("checkin_event_group", { p_group_id: groupId });
  if (error) throw error;
  return data as number;
}

export async function listRecentEventCheckins(sb: SupabaseClient, eventId: string): Promise<RecentEventCheckin[]> {
  const { data, error } = await sb.rpc("list_recent_event_checkins", { p_event_id: eventId, p_limit: 20 });
  if (error) throw error;
  return (data ?? []) as RecentEventCheckin[];
}

// ---------- Palestrantes (EVT007) ----------
export async function listEventSpeakers(sb: SupabaseClient, eventId: string): Promise<EventSpeaker[]> {
  const { data, error } = await sb.from("event_speakers").select("*").eq("event_id", eventId).order("order_index");
  if (error) return [];
  return (data ?? []) as EventSpeaker[];
}

export async function saveEventSpeakers(sb: SupabaseClient, eventId: string, speakers: Omit<EventSpeaker, "event_id" | "created_at">[]): Promise<void> {
  // Substitui a lista inteira — mais simples e previsível do que diffs parciais pra um formulário pequeno como esse.
  const { error: delErr } = await sb.from("event_speakers").delete().eq("event_id", eventId);
  if (delErr) throw delErr;
  if (speakers.length === 0) return;
  const { error } = await sb.from("event_speakers").insert(
    speakers.map((s, i) => ({ id: s.id, event_id: eventId, name: s.name, photo_url: s.photo_url, topic: s.topic, order_index: i }))
  );
  if (error) throw error;
}

// ---------- Promoção de lista de espera (EVT008) ----------
export async function listMyPendingPromotions(sb: SupabaseClient): Promise<PendingPromotion[]> {
  const { data, error } = await sb.rpc("list_my_pending_promotions");
  if (error) return [];
  return (data ?? []) as PendingPromotion[];
}

export async function acknowledgeEventPromotion(sb: SupabaseClient, registrationId: string): Promise<void> {
  const { error } = await sb.rpc("acknowledge_event_promotion", { p_registration_id: registrationId });
  if (error) throw error;
}

// ---------- Mudanças de evento (EVT009) ----------
export async function listMyEventChanges(sb: SupabaseClient): Promise<EventChange[]> {
  const { data, error } = await sb.rpc("list_my_event_changes");
  if (error) return [];
  return (data ?? []) as EventChange[];
}

export async function acknowledgeEventChange(sb: SupabaseClient, registrationId: string): Promise<void> {
  const { error } = await sb.rpc("acknowledge_event_change", { p_registration_id: registrationId });
  if (error) throw error;
}

// ---------- Gestão de inscritos (EVT011) ----------
export async function adminUpdateRegistration(
  sb: SupabaseClient, registrationId: string, fullName: string, email: string | null, phone: string | null, cpf: string | null
): Promise<void> {
  const { error } = await sb.rpc("admin_update_registration", {
    p_registration_id: registrationId, p_full_name: fullName, p_email: email, p_phone: phone, p_cpf: cpf,
  });
  if (error) throw error;
}

export async function adminMoveRegistrationStatus(sb: SupabaseClient, registrationId: string, newStatus: "confirmada" | "lista_espera"): Promise<void> {
  const { error } = await sb.rpc("admin_move_registration_status", { p_registration_id: registrationId, p_new_status: newStatus });
  if (error) throw error;
}

// ---------- Pós-evento (EVT012) ----------
export async function finalizeEventAttendance(sb: SupabaseClient, eventId: string): Promise<number> {
  const { data, error } = await sb.rpc("finalize_event_attendance", { p_event_id: eventId });
  if (error) throw error;
  return data as number;
}

export async function submitEventFeedback(sb: SupabaseClient, eventId: string, rating: number, comment: string | null): Promise<void> {
  const { error } = await sb.rpc("submit_event_feedback", { p_event_id: eventId, p_rating: rating, p_comment: comment });
  if (error) throw error;
}

export async function getEventFeedbackSummary(sb: SupabaseClient, eventId: string): Promise<EventFeedbackSummary | null> {
  const { data, error } = await sb.rpc("get_event_feedback_summary", { p_event_id: eventId }).maybeSingle();
  if (error) return null;
  return data as EventFeedbackSummary | null;
}

export async function hasSubmittedEventFeedback(sb: SupabaseClient, eventId: string): Promise<boolean> {
  const { data, error } = await sb.rpc("has_submitted_event_feedback", { p_event_id: eventId });
  if (error) return false;
  return !!data;
}
