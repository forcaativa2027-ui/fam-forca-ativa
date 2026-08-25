"use client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ChurchGivingInfo } from "@/types/domain";

export async function getChurchGivingInfo(sb: SupabaseClient, churchId: string): Promise<ChurchGivingInfo | null> {
  const { data, error } = await sb.from("church_giving_info").select("*").eq("church_id", churchId).maybeSingle();
  if (error) { console.error("[giving] getChurchGivingInfo", error); return null; }
  return data as ChurchGivingInfo | null;
}

export async function upsertChurchGivingInfo(sb: SupabaseClient, input: {
  church_id: string; qr_code_url?: string; cnpj?: string; razao_social?: string; banco?: string; pix_key?: string;
}): Promise<void> {
  const { error } = await sb.from("church_giving_info").upsert(input, { onConflict: "church_id" });
  if (error) throw error;
}

export async function uploadGivingQrCode(sb: SupabaseClient, churchId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() ?? "png";
  const path = `giving-qr/${churchId}.${ext}`;
  const { error: upErr } = await sb.storage.from("institutional-assets").upload(path, file, {
    contentType: file.type, upsert: true,
  });
  if (upErr) throw upErr;
  const { data } = sb.storage.from("institutional-assets").getPublicUrl(path);
  return `${data.publicUrl}?t=${Date.now()}`;
}
