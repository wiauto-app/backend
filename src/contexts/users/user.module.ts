import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { PasswordService } from "../auth/services/password.service";
import { AuthModule } from "../auth/auth.module";
import { VehicleEntity } from "../vehicles/infrastructure/persistence/vehicle.entity";
import { ProfileModule } from "../profiles/profile.module";
import { RolesModule } from "../roles/roles.module";
import { UsersController } from "./api/v1/users.controller";
import { UserSuspensionsController } from "./api/v1/user-suspensions.controller";
import { User } from "./entities/user.entity";
import { SuspensionDurationType } from "./entities/suspension_duration_type.entity";
import { UserMailService } from "./services/user-mail.service";
import { UserService } from "./services/user.service";
import { SuspensionService } from "./services/suspension.service";

@Module({
  controllers: [UsersController, UserSuspensionsController],
  providers: [UserService, PasswordService, UserMailService, SuspensionService],
  imports: [
    TypeOrmModule.forFeature([User, VehicleEntity, SuspensionDurationType]),
    ProfileModule,
    RolesModule,
    forwardRef(() => AuthModule),
  ],
  exports: [UserService, UserMailService, SuspensionService],
})
export class UserModule {}
