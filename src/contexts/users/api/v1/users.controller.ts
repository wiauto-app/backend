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
  UseGuards,
} from "@nestjs/common";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { CreateUserDto } from "../../dto/create-user.dto";
import { UpdateUserDto } from "../../dto/update-user.dto";
import { UserService } from "../../services/user.service";
import { V1_USERS } from "../../route.constants";

@Controller(V1_USERS)
export class UsersController {
  constructor(private readonly user_service: UserService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() create_user_dto: CreateUserDto) {
    return this.user_service.create(create_user_dto);
  }

  @Get()
  // @UseGuards(JwtGuard)
  findAll() {
    return this.user_service.findAll();
  }

  @Get(":id")
  @UseGuards(JwtGuard)
  find_one(@Param("id", ParseUUIDPipe) id: string) {
    return this.user_service.findOne(id);
  }

  @Patch(":id")
  @UseGuards(JwtGuard)
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() update_user_dto: UpdateUserDto,
  ) {
    return this.user_service.update(id, update_user_dto);
  }

  @Delete(":id")
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param("id", ParseUUIDPipe) id: string) {
    await this.user_service.remove(id);
  }
}
