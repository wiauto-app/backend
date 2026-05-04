import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from "@nestjs/common";
import { CreatePermissionDto } from "../../dto/create-permission.dto";
import { DeletePermissionDto } from "../../dto/delete-permission.dto";
import { FindOnePermissionDto } from "../../dto/find-one-permission.dto";
import { UpdatePermissionDto } from "../../dto/update-permission.dto";
import { V1_PERMISSIONS } from "../../route.constants";
import { PermissionService } from "../../services/permission.service";
import { AuthPermissions } from "@/src/contexts/users/permissions/decorators/authPermission.decorator";
import { PermissionKeys } from "../../lib/available-permission";


@AuthPermissions(PermissionKeys.PERMISSIONS_MANAGE)
@Controller(V1_PERMISSIONS)
export class PermissionsController {
  constructor(private readonly permission_service: PermissionService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() create_permission_dto: CreatePermissionDto) {
    return this.permission_service.create(create_permission_dto);
  }

  @Post("sync-available-keys-file")
  @HttpCode(HttpStatus.OK)
  sync_available_keys_file() {
    return this.permission_service.sync_available_permission_keys_file();
  }

  @Get()
  findAll() {
    return this.permission_service.findAll();
  }

  @Get(":id")
  findOne(@Param() find_one_permission_dto: FindOnePermissionDto) {
    return this.permission_service.findOne(find_one_permission_dto.id);
  }

  @Patch(":id")
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() update_permission_dto: UpdatePermissionDto,
  ) {
    return this.permission_service.update(id, update_permission_dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param() delete_permission_dto: DeletePermissionDto) {
    await this.permission_service.remove(delete_permission_dto.id);
  }
}
