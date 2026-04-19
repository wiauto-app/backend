import { forwardRef, Module } from "@nestjs/common";

import { UserController } from "./api/user.controller";
import { UserService } from "./services/user.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "./entities/user.entity";
import { PasswordService } from "../auth/services/password.service";
import { ProfileModule } from "../profiles/profile.module";
import { AuthModule } from "../auth/auth.module";
import { UserMailService } from "./services/user-mail.service";

@Module({
  controllers: [UserController],
  providers: [UserService, PasswordService, UserMailService],
  imports: [
    TypeOrmModule.forFeature([User]),
    ProfileModule,
    forwardRef(() => AuthModule),
  ],
  exports: [UserService, UserMailService],
})
export class UserModule {}
