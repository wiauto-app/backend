import { Controller, Get, UseGuards } from "@nestjs/common";

import { GetUser } from "../decorators/GetUser.decorator";
import { MeResponseDto } from "../dto/me-response.dto";
import { JwtGuard } from "../guards/auth.guard";
import { MeService } from "../services/me.service";
import { UserResponse } from "../types/auth.types";

@Controller("/auth/me")
export class MeController {
  constructor(private readonly meService: MeService) {}

  @UseGuards(JwtGuard)
  @Get()
  getMe(@GetUser() user: UserResponse): MeResponseDto {
    return this.meService.getMe(user);
  }
}
