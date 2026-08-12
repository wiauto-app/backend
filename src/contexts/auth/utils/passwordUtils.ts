import { SALT_ROUNDS } from "@/src/common/constants"
import bcrypt from "bcrypt"

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS)
}

export async function comparePassword(password: string, hashedPassword: string):Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword)
}