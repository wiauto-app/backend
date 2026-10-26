import { describe, expect, it } from "vitest";

import { verifyTurnstileToken } from "@/src/common/antispam/turnstile";

describe("verifyTurnstileToken", () => {
  it("devuelve booleano sin lanzar", async () => {
    const result = await verifyTurnstileToken("token-de-prueba");
    expect(typeof result).toBe("boolean");
  });
});
