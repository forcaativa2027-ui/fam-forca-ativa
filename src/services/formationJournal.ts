"use client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { FormationJournalEntry, JournalEntryType } from "@/types/domain";

export async function listMyJournalEntries(sb: SupabaseClient, profileId: string): Promise<FormationJournalEntry[]> {
  const { data, error } = await sb.from("formation_journal_entries").select("*").eq("profile_id", profileId).order("created_at", { ascending: false });
  if (error) { console.error("[journal] listMyJournalEntries", error); return []; }
  return (data ?? []) as FormationJournalEntry[];
}

export async function createJournalEntry(sb: SupabaseClient, input: {
  profile_id: string; entry_type: JournalEntryType; content: string; course_id?: string | null; is_private?: boolean;
}): Promise<void> {
  const { error } = await sb.from("formation_journal_entries").insert(input);
  if (error) throw error;
}

export async function deleteJournalEntry(sb: SupabaseClient, id: string): Promise<void> {
  const { error } = await sb.from("formation_journal_entries").delete().eq("id", id);
  if (error) throw error;
}
