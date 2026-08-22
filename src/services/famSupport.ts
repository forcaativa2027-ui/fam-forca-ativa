import type { SupabaseClient } from "@supabase/supabase-js";

export interface FamConversation {
  id: string;
  public_reference: string;
  user_id: string | null;
  community_id: string | null;
  status: 'waiting' | 'in_progress' | 'paused_safe_contact' | 'referred' | 'resolved' | 'closed' | 'escalated';
  contact_name: string | null;
  safe_contact_note: string | null;
  assigned_attendant_id: string | null;
  emergency_acknowledged: boolean;
  consented_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FamMessage {
  id: string;
  conversation_id: string;
  sender_user_id: string | null;
  sender_attendant_id: string | null;
  body: string;
  delivered_at: string | null;
  read_at: string | null;
  created_at: string;
}

export interface FamAttendant {
  id: string;
  profile_id: string;
  role_label: string;
  status: 'pending_training' | 'active' | 'paused' | 'suspended' | 'revoked';
  training_accepted_at: string | null;
  supervisor_profile_id: string | null;
  created_at: string;
  updated_at: string;
}

export async function createConversation(
  sb: SupabaseClient,
  data: { user_id: string; community_id?: string; contact_name?: string }
): Promise<FamConversation> {
  const { data: conv, error } = await sb
    .from("fam_conversations")
    .insert({
      user_id: data.user_id,
      community_id: data.community_id,
      contact_name: data.contact_name,
      emergency_acknowledged: true,
      consented_at: new Date().toISOString(),
    })
    .select("*")
    .single();
  if (error) throw error;
  return conv as FamConversation;
}

export async function getConversation(
  sb: SupabaseClient,
  conversationId: string
): Promise<FamConversation | null> {
  const { data, error } = await sb
    .from("fam_conversations")
    .select("*")
    .eq("id", conversationId)
    .maybeSingle();
  if (error) throw error;
  return data as FamConversation | null;
}

export async function listUserConversations(
  sb: SupabaseClient,
  userId: string
): Promise<FamConversation[]> {
  const { data, error } = await sb
    .from("fam_conversations")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as FamConversation[];
}

export async function createMessage(
  sb: SupabaseClient,
  data: { conversation_id: string; sender_user_id?: string; sender_attendant_id?: string; body: string }
): Promise<FamMessage> {
  const { data: msg, error } = await sb
    .from("fam_messages")
    .insert({
      conversation_id: data.conversation_id,
      sender_user_id: data.sender_user_id,
      sender_attendant_id: data.sender_attendant_id,
      body: data.body,
      delivered_at: new Date().toISOString(),
    })
    .select("*")
    .single();
  if (error) throw error;
  return msg as FamMessage;
}

export async function listMessages(
  sb: SupabaseClient,
  conversationId: string
): Promise<FamMessage[]> {
  const { data, error } = await sb
    .from("fam_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as FamMessage[];
}

export async function subscribeToMessages(
  sb: SupabaseClient,
  conversationId: string,
  callback: (msg: FamMessage) => void
) {
  return sb
    .channel(`fam_messages:${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "fam_messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => callback(payload.new as FamMessage)
    )
    .subscribe();
}

export async function getAvailableAttendants(
  sb: SupabaseClient
): Promise<FamAttendant[]> {
  const { data, error } = await sb
    .from("fam_attendants")
    .select("*")
    .eq("status", "active")
    .order("created_at");
  if (error) throw error;
  return (data ?? []) as FamAttendant[];
}

export async function assignAttendant(
  sb: SupabaseClient,
  conversationId: string,
  attendantId: string
): Promise<void> {
  const { error } = await sb
    .from("fam_conversations")
    .update({ assigned_attendant_id: attendantId, status: "in_progress" })
    .eq("id", conversationId);
  if (error) throw error;
}
