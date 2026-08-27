import { describe, expect, it } from "vitest";
import { isFamCredentialCurrentlyValid } from "./famProfessionalAccess";

const NOW = Date.parse("2026-08-27T12:00:00.000Z");

describe("FAM professional credential access", () => {
  it("accepts an active credential inside its validity window", () => {
    expect(isFamCredentialCurrentlyValid({
      status: "active",
      valid_from: "2026-08-27T00:00:00.000Z",
      valid_until: "2026-08-28T00:00:00.000Z",
    }, NOW)).toBe(true);
  });

  it("rejects a credential that has not started", () => {
    expect(isFamCredentialCurrentlyValid({
      status: "active",
      valid_from: "2026-08-27T13:00:00.000Z",
      valid_until: null,
    }, NOW)).toBe(false);
  });

  it("rejects expired, suspended and malformed credentials", () => {
    expect(isFamCredentialCurrentlyValid({ status: "active", valid_from: "2026-08-20T00:00:00.000Z", valid_until: "2026-08-27T12:00:00.000Z" }, NOW)).toBe(false);
    expect(isFamCredentialCurrentlyValid({ status: "suspended", valid_from: "2026-08-20T00:00:00.000Z", valid_until: null }, NOW)).toBe(false);
    expect(isFamCredentialCurrentlyValid({ status: "active", valid_from: "invalid-date", valid_until: null }, NOW)).toBe(false);
  });
});
