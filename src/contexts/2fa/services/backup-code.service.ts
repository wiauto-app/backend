import { randomBytes } from "node:crypto"
import { Injectable } from "@nestjs/common";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

@Injectable()
export class BackupCodeService {

  generateBackupCode(): string {
    const bytes = randomBytes(8)
    const code = [...bytes]
      .map(b => ALPHABET[b % ALPHABET.length])
      .join("")
    return `${code.slice(0, 4)}-${code.slice(4, 8)}`
  }
}