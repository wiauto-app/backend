import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { PasswordService } from "../auth/services/password.service";
import { AuthModule } from "../auth/auth.module";
import { VehicleEntity } from "../vehicles/entities/vehicle.entity";
import { ProfileModule } from "../profiles/profile.module";
import { RolesModule } from "../roles/roles.module";
import { UsersController } from "./api/v1/users.controller";
import { UserSuspensionsController } from "./api/v1/user-suspensions.controller";
import { User } from "./entities/user.entity";
import { UserAuthProvider } from "./entities/user-auth-provider.entity";
import { SuspensionDurationType } from "./entities/suspension_duration_type.entity";
import { UserMailService } from "./services/user-mail.service";
import { UserService } from "./services/user.service";
import { UserAuthProviderService } from "./services/user-auth-provider.service";
import { SuspensionService } from "./services/suspension.service";
import { AdminUsersController } from "./api/admin-v1/admin-users.controller";
import { AdminUserService } from "./services/admin-user.service";
import { AdminSuspensionController } from "./api/admin-v1/admin-suspension.controller";
import { AdminSuspensionService } from "./services/admin-suspension.service";
import { RolesPermissionsController } from "./roles-permissions/api/roles-permissions.controller";
import { RolesPermissionsService } from "./roles-permissions/services/roles-permissions.service";
import { RolesPermissionsEntity } from "./roles-permissions/entities/roles-permissions.entity";

@Module({
  controllers: [UsersController, UserSuspensionsController, AdminUsersController, AdminSuspensionController, RolesPermissionsController],
  providers: [UserService, UserAuthProviderService, PasswordService, UserMailService, SuspensionService, AdminUserService, AdminSuspensionService, RolesPermissionsService],
  imports: [
    TypeOrmModule.forFeature([User, UserAuthProvider, VehicleEntity, SuspensionDurationType, RolesPermissionsEntity]),
    ProfileModule,
    RolesModule,
    forwardRef(() => AuthModule),
  ],
  exports: [UserService, UserAuthProviderService, UserMailService, SuspensionService],
})
export class UserModule { }
