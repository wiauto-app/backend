import { forwardRef, Global, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "../../auth/auth.module";
import { Roles } from "../../roles/entities/roles.entity";
import { PermissionsController } from "./api/v1/permissions.controller";
import { Permissions } from "./entities/permissions.entity";
import { PermissionGuard } from "./guards/permission.guard";
import { PermissionService } from "./services/permission.service";
import { PermissionsCatalogSyncService } from "./services/permissions-catalog-sync.service";

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([Permissions, Roles]),
    forwardRef(() => AuthModule),
  ],
  controllers: [PermissionsController],
  providers: [
    PermissionService,
    PermissionGuard,
    PermissionsCatalogSyncService,
  ],
  exports: [PermissionService, PermissionGuard, PermissionsCatalogSyncService],
})
export class PermissionModule {}
