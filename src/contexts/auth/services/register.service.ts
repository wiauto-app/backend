import { Injectable, UnauthorizedException } from "@nestjs/common";

import { ApiResponse } from "@/src/common/types/default.types";
import { RolesService } from "../../roles/services/roles.service";
import { User } from "../../users/entities/user.entity";
import { UserService } from "../../users/services/user.service";
import { RegisterDto } from "../dto/register.dto";
import { authResponseConfig } from "../response.config";

@Injectable()
export class RegisterService {
  constructor(
    private readonly userService: UserService,
    private readonly rolesService: RolesService,
  ) {}

  async register(registerDto: RegisterDto): Promise<ApiResponse<User>> {
    const defaultRole = await this.rolesService.findDefault();

    if (!defaultRole) {
      throw new UnauthorizedException(authResponseConfig.messages.ROLE_NOT_FOUND);
    }

    return this.userService.create({
      email: registerDto.email,
      password: registerDto.password,
      name: registerDto.name,
      last_name: registerDto.last_name,
      role_id: defaultRole.id,
    });
  }
}
