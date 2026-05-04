import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
} from "@nestjs/common";
import { AssignPermissionsToRoleDto } from "../../dto/assign-permissions-to-role.dto";
import { CreateRoleDto } from "../../dto/create-role.dto";
import { DeleteRoleDto } from "../../dto/delete-role.dto";
import { FindOneRoleDto } from "../../dto/find-one-role.dto";
import { V1_ROLES } from "../../route.constants";
import { RolesService } from "../../services/roles.service";
import { UpdateRoleDto } from "../../dto/update-role.dto";
import { PermissionKeys } from "@/src/contexts/users/permissions/lib/available-permission";
import { AuthPermissions } from "../../../users/permissions/decorators/authPermission.decorator";

@AuthPermissions(PermissionKeys.ROLES_MANAGE)
@Controller(V1_ROLES)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Get()
  findAll() {
    return this.rolesService.findAll();
  }

  @Put(":id/permissions")
  assign_permissions(
    @Param("id", ParseUUIDPipe) role_id: string,
    @Body() assign_permissions_dto: AssignPermissionsToRoleDto,
  ) {
    return this.rolesService.assign_permissions(
      role_id,
      assign_permissions_dto.permission_ids,
    );
  }

  @Get(":id")
  findOne(@Param() findOneRoleDto: FindOneRoleDto) {
    return this.rolesService.findOne(findOneRoleDto.id);
  }

  @Patch(":id")
  update(@Param("id", ParseUUIDPipe) id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.rolesService.update(id, updateRoleDto);
  }

  @Delete(":id")
  remove(@Param() deleteRoleDto: DeleteRoleDto) {
    return this.rolesService.remove(deleteRoleDto.id);
  }
}