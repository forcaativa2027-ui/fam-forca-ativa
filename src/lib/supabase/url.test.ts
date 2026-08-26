import { describe, expect, it } from "vitest";
import { normalizeSupabaseUrl } from "./url";

describe("normalizeSupabaseUrl", () => {
  it("remove rest/v1 e barras finais", () => {
    expect(normalizeSupabaseUrl(" https://example.supabase.co/rest/v1/ ")).toBe("https://example.supabase.co");
  });

  it("remove bases de API alternativas", () => {
    expect(normalizeSupabaseUrl("https://example.supabase.co/auth/v1")).toBe("https://example.supabase.co");
    expect(normalizeSupabaseUrl("https://example.supabase.co/storage/v1/")).toBe("https://example.supabase.co");
  });

  it("preserva a origem correta", () => {
    expect(normalizeSupabaseUrl("https://example.supabase.co")).toBe("https://example.supabase.co");
  });
});
