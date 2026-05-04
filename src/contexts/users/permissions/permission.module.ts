import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "../../auth/auth.module";
import { Roles } from "../../roles/entities/roles.entity";
import { PermissionsController } from "./api/v1/permissions.controller";
import { Permissions } from "./entities/permissions.entity";
import { PermissionGuard } from "./guards/permission.guard";
import { PermissionService } from "./services/permission.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([Permissions, Roles]),
    AuthModule,
  ],
  controllers: [PermissionsController],
  providers: [PermissionService, PermissionGuard],
  exports: [PermissionService, PermissionGuard],
})
export class PermissionModule {}
