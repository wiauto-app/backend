import { Global, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Permissions } from "../users/permissions/entities/permissions.entity";
import { RolesController } from "./api/v1/roles.controller";
import { Roles } from "./entities/roles.entity";
import { RolesService } from "./services/roles.service";
import { StaffRoleGuard } from "./guards/staff-role.guard";

@Global()
@Module({
  controllers: [RolesController],
  providers: [RolesService, StaffRoleGuard],
  imports: [TypeOrmModule.forFeature([Roles, Permissions])],
  exports: [StaffRoleGuard, RolesService],
})
export class RolesModule { }