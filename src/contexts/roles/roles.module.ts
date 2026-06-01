import { Global, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Permissions } from "../users/permissions/entities/permissions.entity";
import { RolesController } from "./api/v1/roles.controller";
import { Roles } from "./entities/roles.entity";
import { RolesService } from "./services/roles.service";
import { StaffRoleGuard } from "./guards/staff-role.guard";
import { AdminOnlyGuard } from "./guards/admin-only.guard";
import { DeveloperOnlyGuard } from "./guards/developer-only.guard";

@Global()
@Module({
  controllers: [RolesController],
  providers: [RolesService, StaffRoleGuard, AdminOnlyGuard, DeveloperOnlyGuard],
  imports: [TypeOrmModule.forFeature([Roles, Permissions])],
  exports: [StaffRoleGuard, AdminOnlyGuard, DeveloperOnlyGuard, RolesService],
})
export class RolesModule { }