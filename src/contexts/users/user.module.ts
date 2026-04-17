import { Module } from "@nestjs/common";

import { UserController } from "./api/user.controller";
import { UserService } from "./services/user.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "./entities/user.entity";
import { PasswordService } from "../auth/services/password.service";
import { ProfileModule } from "../profiles/profile.module";

@Module({
  controllers: [UserController],
  providers:[UserService,PasswordService],
  imports:[TypeOrmModule.forFeature([User]),ProfileModule],
  exports:[UserService]
})
export class UserModule {}
