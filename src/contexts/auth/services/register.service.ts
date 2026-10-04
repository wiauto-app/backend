import { Injectable } from "@nestjs/common";

import { ApiResponse } from "@/src/common/types/default.types";
import { User } from "../../users/entities/user.entity";
import { UserService } from "../../users/services/user.service";
import { RegisterDto } from "../dto/register.dto";
import { AuthSecurityMailService } from "./auth-security-mail.service";

@Injectable()
export class RegisterService {
  constructor(
    private readonly userService: UserService,
    private readonly authSecurityMailService: AuthSecurityMailService,
  ) {}

  async register(registerDto: RegisterDto): Promise<ApiResponse<User>> {
    const result = await this.userService.create({
      email: registerDto.email,
      password: registerDto.password,
      name: registerDto.name,
      last_name: registerDto.last_name,
      phone_code: registerDto.phone_code,
      phone: registerDto.phone,
    });

    this.authSecurityMailService.enqueueNewUserRegistered({
      email: registerDto.email,
      name: registerDto.name,
      last_name: registerDto.last_name,
      phone_code: registerDto.phone_code,
      phone: registerDto.phone,
      created_at: result.data?.created_at,
    });

    return result;
  }
}
