import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";

import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { RequireStaffRole } from "@/src/contexts/roles/decorators/require-staff-role.decorator";
import { StaffRoleGuard } from "@/src/contexts/roles/guards/staff-role.guard";

import { SuspendUserBodyDto } from "../../dto/suspend-user.dto";
import { SuspensionService } from "../../services/suspension.service";
import { V1_USER_SUSPENSIONS } from "../../route.constants";

@Controller(V1_USER_SUSPENSIONS)
@UseGuards(JwtGuard, StaffRoleGuard)
@RequireStaffRole()
export class UserSuspensionsController {
  constructor(private readonly suspension_service: SuspensionService) {}

  @Get("duration-types")
  list_duration_types() {
    return this.suspension_service.list_active_duration_types();
  }

  @Post(":user_id/suspend")
  @HttpCode(HttpStatus.NO_CONTENT)
  async suspend(
    @Req() request: Request,
    @Param("user_id", ParseUUIDPipe) user_id: string,
    @Body() body: SuspendUserBodyDto,
  ): Promise<void> {
    const actor_id = request.user?.id;
    if (!actor_id) {
      throw new UnauthorizedException("Usuario no autenticado");
    }
    await this.suspension_service.suspend_user(actor_id, user_id, body);
  }

  @Post(":user_id/unsuspend")
  @HttpCode(HttpStatus.NO_CONTENT)
  async unsuspend(@Param("user_id", ParseUUIDPipe) user_id: string): Promise<void> {
    await this.suspension_service.unsuspend_user(user_id);
  }
}
