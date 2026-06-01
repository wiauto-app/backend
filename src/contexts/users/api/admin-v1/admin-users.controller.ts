import { Body, Controller, Delete, Param, ParseUUIDPipe, Patch, Post, UseGuards } from "@nestjs/common";
import { V1_ADMIN_USERS } from "../../route.constants";
import { AdminCreateUserDto } from "../../dto/admin/create-user.dto";
import { AdminUserService } from "../../services/admin-user.service";
import { AdminUpdateUserDto } from "../../dto/admin/update-user.dto";
import { JwtGuard } from "../../../auth/guards/auth.guard";
import { AdminOnlyGuard } from "../../../roles/guards/admin-only.guard";

@Controller(V1_ADMIN_USERS)
@UseGuards(JwtGuard, AdminOnlyGuard)
export class AdminUsersController {
  constructor(private readonly adminUserService: AdminUserService) { }

  @Post()
  create(@Body() createUserDto: AdminCreateUserDto) {
    return this.adminUserService.create(createUserDto);
  }

  @Patch()
  update(@Body() updateUserDto: AdminUpdateUserDto) {
      return this.adminUserService.update(updateUserDto);
  }

  @Delete(":id")
  delete(@Param("id", ParseUUIDPipe) id: string) {
    return this.adminUserService.delete(id);
  }
}