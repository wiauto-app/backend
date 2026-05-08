import { createHash } from "crypto";


export const hashToken = (token: string): string => {
  try {
    return createHash("sha256").update(token).digest("hex");
  } catch {
    throw new Error("Error al hashear el token");
  }
}