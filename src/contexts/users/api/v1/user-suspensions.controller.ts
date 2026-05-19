import {
  Body,
  Controller,
  Get,
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
import { UnsuspendUserBodyDto } from "../../dto/admin/unsuspend-user.dto";

@Controller(V1_USER_SUSPENSIONS)
@UseGuards(JwtGuard, StaffRoleGuard)
@RequireStaffRole()
export class UserSuspensionsController {
  constructor(private readonly suspension_service: SuspensionService) {}

  @Get("duration-types")
  list_duration_types() {
    return this.suspension_service.list_active_duration_types();
  }

  @Post("suspend")
  async suspend(
    @Body() body: SuspendUserBodyDto,
    @Req() request: Request,
  ): Promise<void> {
    const actor_id = request.user?.id;
    if (!actor_id) {
      throw new UnauthorizedException("Usuario no autenticado");
    }
    await this.suspension_service.suspend_user(body, actor_id);
  }

  @Post("unsuspend")
  async unsuspend(@Body() body: UnsuspendUserBodyDto): Promise<void> {
    await this.suspension_service.unsuspend_user(body);
  }
}
