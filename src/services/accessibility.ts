"use client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserPreferences, AccessibilityTheme, AccessibilityFontSize } from "@/types/domain";

export const DEFAULT_PREFERENCES: Omit<UserPreferences, "profile_id" | "updated_at"> = {
  theme: "claro", font_size: "media", extra: {}, onboarded: false,
};

export async function getUserPreferences(sb: SupabaseClient, profileId: string): Promise<UserPreferences | null> {
  const { data, error } = await sb.from("user_preferences").select("*").eq("profile_id", profileId).maybeSingle();
  if (error) { console.error("[accessibility] getUserPreferences", error); return null; }
  return data as UserPreferences | null;
}

export async function upsertUserPreferences(sb: SupabaseClient, profileId: string, patch: Partial<{
  theme: AccessibilityTheme; font_size: AccessibilityFontSize; extra: Record<string, unknown>; onboarded: boolean;
}>): Promise<void> {
  const { error } = await sb.from("user_preferences")
    .upsert({ profile_id: profileId, ...patch, updated_at: new Date().toISOString() }, { onConflict: "profile_id" });
  if (error) throw error;
}
