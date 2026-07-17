import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { V1_ADMIN_SUSPENSION } from "../../route.constants";
import { AdminSuspensionService } from "../../services/admin-suspension.service";
import { FindAllSuspensionDurationTypesDto } from "../../dto/admin/find-all-suspension.dto";
import { PaginatedResult } from "@/src/contexts/shared/types/paginated-result.vo";
import { SuspensionDurationType } from "../../entities/suspension_duration_type.entity";
import { FindOneSuspensionDurationTypeDto } from "../../dto/admin/find-one-suspension.dto";
import { CreateSuspensionDurationTypeDto } from "../../dto/admin/create-suspension.dto";
import { UpdateSuspensionDurationTypeDto } from "../../dto/admin/update-suspension.dto";
import { DeleteSuspensionDurationTypeDto } from "../../dto/admin/delete-suspension.dto";
import { AuthPermissions } from "../../permissions/decorators/authPermission.decorator";
import { PermissionKeys } from "../../permissions/lib/available-permission";
import { JwtGuard } from "../../../auth/guards/auth.guard";
import { AdminOnlyGuard } from "../../../roles/guards/admin-only.guard";

@Controller(V1_ADMIN_SUSPENSION)
@UseGuards(JwtGuard, AdminOnlyGuard)
@AuthPermissions(PermissionKeys.SUSPENSION_MANAGE)
export class AdminSuspensionController {
  constructor(
    private readonly adminSuspensionService: AdminSuspensionService,
  ) {}

  @Get()
  async findAll(@Query() dto: FindAllSuspensionDurationTypesDto): Promise<PaginatedResult<SuspensionDurationType>> {
    return this.adminSuspensionService.findAll(dto);
  }

  @Get(":id")
  async findOne(@Param() dto: FindOneSuspensionDurationTypeDto): Promise<SuspensionDurationType> {
    return this.adminSuspensionService.findOne(dto);
  }

  @Post()
  async create(@Body() dto: CreateSuspensionDurationTypeDto): Promise<SuspensionDurationType> {
    return this.adminSuspensionService.create(dto);
  }

  @Patch(":id")
  async update(@Param() dto: UpdateSuspensionDurationTypeDto): Promise<SuspensionDurationType> {
    return this.adminSuspensionService.update(dto);
  }

  @Delete(":id")
  async delete(@Param() dto: DeleteSuspensionDurationTypeDto): Promise<void> {
    return this.adminSuspensionService.delete(dto);
  }
}