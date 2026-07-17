import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { DealershipInvitationModule } from "../dealership/modules/dealership-invitation.module";
import { User } from "../users/entities/user.entity";
import { TypeOrmAdminProfileRepository } from "@/src/contexts/profiles/repositories/typeorm.admin-profile-repository";
import { TypeOrmProfileRepository } from "@/src/contexts/profiles/repositories/typeorm.profile-repository";
import { TypeOrmProfileUserRepository } from "@/src/contexts/profiles/repositories/typeorm.profile-user-repository";
import { UpdateMyProfileController } from "./api/auth-me/update-my-profile/update-my-profile.controller";
import { AdminUpdateProfileController } from "./api/v1-admin/admin-update-profile/admin-update-profile.controller";
import { AdminCreateProfileController } from "./api/v1-admin/create-profile/admin-create-profile.controller";
import { CreateProfileController } from "./api/v1/create-profile/create-profile.controller";
import { FindAllProfilesController } from "./api/v1/find-all-profiles/find-all-profiles.controller";
import { FindOneProfileController } from "./api/v1/find-one-profile/find-one-profile.controller";
import { RemoveProfileController } from "./api/v1/remove-profile/remove-profile.controller";
import { UpdateProfileController } from "./api/v1/update-profile/update-profile.controller";
import { ProfileEntity } from "./entities/profile.entity";
import { ProfileService } from "./services/profile.service";

@Module({
  controllers: [
    CreateProfileController,
    FindAllProfilesController,
    FindOneProfileController,
    UpdateProfileController,
    RemoveProfileController,
    AdminCreateProfileController,
    AdminUpdateProfileController,
    UpdateMyProfileController],
  providers: [
    ProfileService,
    TypeOrmProfileRepository,
    TypeOrmProfileUserRepository,
    TypeOrmAdminProfileRepository
  ],
  exports: [
    ProfileService,
    TypeOrmProfileRepository,
    TypeOrmProfileUserRepository,
    TypeOrmAdminProfileRepository],
  imports: [
    TypeOrmModule.forFeature([ProfileEntity, User]),
    forwardRef(() => DealershipInvitationModule)],
})
export class ProfileModule {}
