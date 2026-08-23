"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Church } from "@/types/domain";

/** Fallback configurável para instalações legadas sem domínio próprio. */
const DEFAULT_SLUG = process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG ?? "manaus";
const TENANT_BASE_DOMAIN = process.env.NEXT_PUBLIC_TENANT_BASE_DOMAIN ?? "cecfamily.com.br";

/** Lista de hosts que NAO sao subdominios de comunidade (deve usar default). */
const NON_COMMUNITY_HOSTS = new Set([
  "localhost", "127.0.0.1", "0.0.0.0",
  "www", "app", "admin", "api", "vercel",
]);

/**
 * Detecta o slug do tenant por query string ou hostname.
 * Query string é útil para preview e links compartilhados; subdomínios usam
 * NEXT_PUBLIC_TENANT_BASE_DOMAIN. O fallback mantém instalações legadas.
 */
export function detectCommunitySlug(): string {
  if (typeof window === "undefined") return DEFAULT_SLUG;
  const params = new URLSearchParams(window.location.search);
  const requested = params.get("tenant") ?? params.get("tenant_slug");
  if (requested && /^[a-z0-9-]+$/i.test(requested)) return requested.toLowerCase();

  const host = window.location.hostname.toLowerCase();
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) return DEFAULT_SLUG;
  if (host.endsWith(".vercel.app")) return DEFAULT_SLUG;
  if (host === TENANT_BASE_DOMAIN || host.endsWith(`.${TENANT_BASE_DOMAIN}`)) {
    const sub = host.slice(0, -(`.${TENANT_BASE_DOMAIN}`).length).split(".").pop();
    if (sub && !NON_COMMUNITY_HOSTS.has(sub)) return sub;
  }
  return DEFAULT_SLUG;
}

export function detectCommunityId(): string | null {
  if (typeof window === "undefined") return null;
  const value = new URLSearchParams(window.location.search).get("church");
  return value && /^[0-9a-f-]{20,}$/i.test(value) ? value : null;
}

/** Busca a comunidade ativa pelo slug. Retorna fallback se nao achar. */
export async function resolveCommunity(sb: SupabaseClient): Promise<Church | null> {
  const requestedId = detectCommunityId();
  const slug = detectCommunitySlug();
  try {
    if (requestedId) {
      const { data, error } = await sb.from("churches").select("*").eq("id", requestedId).maybeSingle();
      if (!error && data) return data as Church;
    }
    const { data, error } = await sb.from("churches").select("*").eq("slug", slug).maybeSingle();
    if (!error && data) return data as Church;
  } catch { /* ignore */ }
  // Fallback: pega a sede ativa
  try {
    const { data } = await sb.from("churches").select("*").eq("type", "sede").limit(1).maybeSingle();
    return (data as Church) ?? null;
  } catch { return null; }
}

/** Helper: monta um Church "default" quando nao conseguimos resolver. */
export function fallbackCommunity(): Church {
  return {
    id: "",
    name: "Organização",
    type: "sede",
    parent_id: null,
    sector_id: null,
    address: null,
    city: null,
    state: null,
    slug: DEFAULT_SLUG,
    pastor_id: null,
    logo_url: null,
    banner_url: null,
    short_name: null,
    primary_color: "#0E2A47",
    secondary_color: "#C9A227",
    short_description: null,
    site_url: null,
    whatsapp_phone: null,
    is_active: true,
  };
}

// ============================================================
// C13b — Estrutura Organizacional
// ============================================================
import type { ChurchDependencies } from "@/types/domain";

export async function getChurchDependencies(sb: SupabaseClient, churchId: string): Promise<ChurchDependencies | null> {
  try {
    const { data, error } = await sb.rpc("church_dependencies", { p_church_id: churchId });
    if (error || !data) return null;
    return data as ChurchDependencies;
  } catch { return null; }
}

export async function moveChurch(sb: SupabaseClient, churchId: string, newParentId: string | null): Promise<void> {
  const { error } = await sb.rpc("move_church", {
    p_church_id: churchId,
    p_new_parent_id: newParentId,
  });
  if (error) throw error;
}

export async function deleteChurch(sb: SupabaseClient, churchId: string): Promise<void> {
  const { error } = await sb.from("churches").delete().eq("id", churchId);
  if (error) throw error;
}
