import { randomBytes } from "node:crypto";

/** Sin 0/O, 1/I/L para evitar confusiones al copiar el enlace. */
const REFERRAL_CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

export const generateReferralCode = (length = 8): string => {
  const bytes = randomBytes(length);
  let code = "";

  for (let index = 0; index < length; index += 1) {
    code += REFERRAL_CODE_ALPHABET[bytes[index] % REFERRAL_CODE_ALPHABET.length];
  }

  return code;
};
