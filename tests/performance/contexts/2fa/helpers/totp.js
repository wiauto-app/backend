import crypto from "k6/crypto";

// Base32 (RFC 4648) decode. otplib genera secretos en este formato.
function base32Decode(input) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const cleaned = String(input).toUpperCase().replace(/=+$/, "");
  const bytes = [];
  let bits = 0;
  let value = 0;

  for (let i = 0; i < cleaned.length; i++) {
    const idx = alphabet.indexOf(cleaned[i]);
    if (idx < 0) {
      throw new Error(`Carácter inválido en secreto base32: ${cleaned[i]}`);
    }
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((value >> bits) & 0xff);
    }
  }

  return new Uint8Array(bytes);
}

// Contador de 8 bytes big-endian
function counterBuffer(counter) {
  const buf = new Uint8Array(8);
  let c = counter;
  for (let i = 7; i >= 0; i--) {
    buf[i] = c & 0xff;
    c = Math.floor(c / 256);
  }
  return buf;
}

// Genera un código TOTP de 6 dígitos compatible con Google Authenticator.
export function generateTotp(secretBase32, step = 30, digits = 6, nowMs = Date.now()) {
  const counter = Math.floor(nowMs / 1000 / step);
  const keyBytes = base32Decode(secretBase32);
  const ctrBytes = counterBuffer(counter);

  const hex = crypto.hmac("sha1", keyBytes.buffer, ctrBytes.buffer, "hex");

  const hmac = [];
  for (let i = 0; i < hex.length; i += 2) {
    hmac.push(parseInt(hex.substr(i, 2), 16));
  }

  const offset = hmac[hmac.length - 1] & 0x0f;
  const bin =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const mod = Math.pow(10, digits);
  return (bin % mod).toString().padStart(digits, "0");
}
