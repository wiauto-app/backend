import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Permissions } from "../users/permissions/entities/permissions.entity";
import { PermissionModule } from "../users/permissions/permission.module";
import { RolesController } from "./api/v1/roles.controller";
import { Roles } from "./entities/roles.entity";
import { RolesService } from "./services/roles.service";
import { StaffRoleGuard } from "./guards/staff-role.guard";

@Module({
  controllers: [RolesController],
  providers: [RolesService, StaffRoleGuard],
  imports: [TypeOrmModule.forFeature([Roles, Permissions]),
    PermissionModule],
  exports: [StaffRoleGuard],
})
export class RolesModule { }