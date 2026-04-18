import { envs } from "@/src/common/envs";
import { Injectable } from "@nestjs/common";
import { createCipheriv, createDecipheriv, randomBytes, createHash } from "node:crypto";

@Injectable()
export class CryptoService {

  private key: Buffer;

  constructor(
  ) {
    // Derivar clave de 32 bytes
    this.key = createHash('sha256').update(envs.TWO_FACTOR_ENCRYPTION_KEY).digest();
  }

  encrypt(text: string): string {
    const iv = randomBytes(16);

    const cipher = createCipheriv('aes-256-gcm', this.key, iv);

    const encrypted = Buffer.concat([
      cipher.update(text, 'utf8'),
      cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    return [
      iv.toString('base64'),
      authTag.toString('base64'),
      encrypted.toString('base64'),
    ].join(':');
  }

  decrypt(text: string): string {
    try {
      const parts = text.split(':');

      if (parts.length !== 3) {
        throw new Error('Invalid format');
      }

      const [iv, tag, ciphertext] = parts.map((part) =>
        Buffer.from(part, 'base64')
      );

      const decipher = createDecipheriv('aes-256-gcm', this.key, iv);
      decipher.setAuthTag(tag);

      const decrypted = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
      ]);

      return decrypted.toString('utf8');
    } catch {
      throw new Error('Decryption failed');
    }
  }
} 