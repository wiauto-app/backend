import { Body, Controller, Patch, Post } from "@nestjs/common";
import { V1_ADMIN_USERS } from "../../route.constants";
import { AdminCreateUserDto } from "../../dto/admin/create-user.dto";
import { AdminUserService } from "../../services/admin-user.service";
import { AdminUpdateUserDto } from "../../dto/admin/update-user.dto";

@Controller(V1_ADMIN_USERS)
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
}