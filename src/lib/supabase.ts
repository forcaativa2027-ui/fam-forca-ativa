"use client";

// Re-exporta o cliente Supabase singleton do client.ts
// Isso garante uma única instância do GoTrueClient em toda a aplicação
export { supabase, hasSupabaseEnv } from "./supabase/client";
export type { SupabaseClient } from "@supabase/supabase-js";
