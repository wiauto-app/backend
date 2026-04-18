import bcrypt from "bcrypt"

import { Injectable } from "@nestjs/common";
import { SALT_ROUNDS } from "@/src/common/constants";

@Injectable()
export class PasswordService {

  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, SALT_ROUNDS)
  }

  async comparePassword(password: string, hashedPassword: string):Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword)
  }
}