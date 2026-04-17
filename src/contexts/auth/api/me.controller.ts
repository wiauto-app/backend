import { Controller, Get, UseGuards } from "@nestjs/common";

import { User } from "../../users/entities/user.entity";
import { GetUser } from "../decorators/GetUser.decorator";
import { MeResponseDto } from "../dto/me-response.dto";
import { AuthGuard } from "../guards/auth.guard";
import { MeService } from "../services/me.service";
import { UserResponse } from "../types/auth.types";

@Controller("/auth/me")
export class MeController {
  constructor(private readonly meService: MeService) {}

  @UseGuards(AuthGuard)
  @Get()
  getMe(@GetUser() user: UserResponse): MeResponseDto {
    return this.meService.getMe(user);
  }
}
