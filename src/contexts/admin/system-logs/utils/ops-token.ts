import { createHash, timingSafeEqual } from "crypto";

export const OPS_TOKEN_HEADER = "x-ops-token";

const digest = (value: string) => createHash("sha256").update(value).digest();

/**
 * Compara en tiempo constante. Se hashea antes para que `timingSafeEqual`
 * reciba buffers del mismo tamaño y no filtre la longitud del token.
 */
export function isValidOpsToken(
  provided: string | string[] | undefined,
  expected: string,
): boolean {
  if (expected === "" || typeof provided !== "string" || provided === "") {
    return false;
  }

  return timingSafeEqual(digest(provided.trim()), digest(expected));
}
