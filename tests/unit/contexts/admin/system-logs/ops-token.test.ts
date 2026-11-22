import { describe, expect, it } from "vitest";

import { isValidOpsToken } from "@/src/contexts/admin/system-logs/utils/ops-token";

const TOKEN = "a".repeat(64);

describe("isValidOpsToken", () => {
  it("accepts the exact token", () => {
    expect(isValidOpsToken(TOKEN, TOKEN)).toBe(true);
  });

  it("ignores surrounding whitespace in the header", () => {
    expect(isValidOpsToken(`  ${TOKEN} `, TOKEN)).toBe(true);
  });

  it("rejects a different token, even with a different length", () => {
    expect(isValidOpsToken("b".repeat(64), TOKEN)).toBe(false);
    expect(isValidOpsToken("short", TOKEN)).toBe(false);
  });

  it("rejects missing, empty or repeated headers", () => {
    expect(isValidOpsToken(undefined, TOKEN)).toBe(false);
    expect(isValidOpsToken("", TOKEN)).toBe(false);
    expect(isValidOpsToken([TOKEN, TOKEN], TOKEN)).toBe(false);
  });

  it("rejects everything when no token is configured", () => {
    expect(isValidOpsToken("", "")).toBe(false);
    expect(isValidOpsToken("anything", "")).toBe(false);
  });
});
