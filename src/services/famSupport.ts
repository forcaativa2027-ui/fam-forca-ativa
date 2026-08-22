import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export type FamConversation = Database["public"]["Tables"]["fam_conversations"]["Row"];
export type FamMessage = Database["public"]["Tables"]["fam_messages"]["Row"];
export type FamAttendant = Database["public"]["Tables"]["fam_attendants"]["Row"];
export type FamConversationStatus = Database["public"]["Enums"]["fam_conversation_status"];
export type FamAttendantStatus = Database["public"]["Enums"]["fam_attendant_status"];
export type FamRiskAttention = Database["public"]["Enums"]["fam_risk_attention"];

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
  return conv;
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
  return data;
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
  return data ?? [];
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
  return msg;
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
  return data ?? [];
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
  return data ?? [];
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
