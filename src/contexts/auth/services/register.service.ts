import { Injectable } from "@nestjs/common";

import { ApiResponse } from "@/src/common/types/default.types";
import { User } from "../../users/entities/user.entity";
import { UserService } from "../../users/services/user.service";
import { RegisterDto } from "../dto/register.dto";

@Injectable()
export class RegisterService {
  constructor(private readonly userService: UserService) {}

  async register(registerDto: RegisterDto): Promise<ApiResponse<User>> {
    return this.userService.create({
      email: registerDto.email,
      password: registerDto.password,
      name: registerDto.name,
      last_name: registerDto.last_name,
    });
  }
}
