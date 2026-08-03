import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";

import { AuthPermissions } from "@/src/contexts/users/permissions/decorators/authPermission.decorator";

import { FindAllPermissionsDto } from "../../dto/find-all-permissions.dto";
import { FindOnePermissionDto } from "../../dto/find-one-permission.dto";
import { DeletePermissionDto } from "../../dto/delete-permission.dto";
import { PermissionKeys } from "../../lib/available-permission";
import { V1_PERMISSIONS } from "../../route.constants";
import { PermissionService } from "../../services/permission.service";

@Controller(V1_PERMISSIONS)
@AuthPermissions(PermissionKeys.PERMISSIONS_MANAGE)
export class PermissionsController {
  constructor(private readonly permission_service: PermissionService) {}

  @Get("catalog")
  listCatalog() {
    return this.permission_service.listCatalog();
  }

  @Post("sync-catalog")
  @HttpCode(HttpStatus.OK)
  syncCatalog() {
    return this.permission_service.syncCatalog();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create() {
    return this.permission_service.create();
  }

  @Post("sync-available-keys-file")
  @HttpCode(HttpStatus.OK)
  sync_available_keys_file() {
    return this.permission_service.sync_available_permission_keys_file();
  }

  @Get()
  findAll(@Query() find_all_permissions_dto: FindAllPermissionsDto) {
    return this.permission_service.findAll(find_all_permissions_dto);
  }

  @Get(":id")
  findOne(@Param() find_one_permission_dto: FindOnePermissionDto) {
    return this.permission_service.findOne(find_one_permission_dto.id);
  }

  @Patch(":id")
  update(@Param("id", ParseUUIDPipe) _id: string) {
    return this.permission_service.update();
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param() _delete_permission_dto: DeletePermissionDto) {
    await this.permission_service.remove();
  }
}
