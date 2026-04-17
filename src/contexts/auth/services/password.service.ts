import bcrypt from "bcrypt"

import { Injectable } from "@nestjs/common";

@Injectable()
export class PasswordService {

  async hashPassword(password: string): Promise<string> {
    const salts = 10
    return await bcrypt.hash(password, salts)
  }

  async comparePassword(password: string, hashedPassword: string):Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword)
  }
}