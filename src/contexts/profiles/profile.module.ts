import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DealershipInvitationModule } from "../dealership/modules/dealership-invitation.module";
import { User } from "../users/entities/user.entity";
import { AdminCreateProfileUseCase } from "./application/profile/admin-create-profile-use-case/admin-create-profile.use-case";
import { CreateProfileUseCase } from "./application/profile/create-profile-use-case/create-profile.use-case";
import { FindAllProfilesUseCase } from "./application/profile/find-all-profiles-use-case/find-all-profiles.use-case";
import { FindOneProfileUseCase } from "./application/profile/find-one-profile-use-case/find-one-profile.use-case";
import { RemoveProfileUseCase } from "./application/profile/remove-profile-use-case/remove-profile.use-case";
import { UpdateProfileUseCase } from "./application/profile/update-profile-use-case/update-profile.use-case";
import { ProfileRepository } from "./domain/repositories/profile.repository";
import { ProfileUserRepository } from "./domain/repositories/profile-user.repository";
import { CreateProfileController } from "./infrastructure/http-api/v1/create-profile/create-profile.controller";
import { FindAllProfilesController } from "./infrastructure/http-api/v1/find-all-profiles/find-all-profiles.controller";
import { FindOneProfileController } from "./infrastructure/http-api/v1/find-one-profile/find-one-profile.controller";
import { RemoveProfileController } from "./infrastructure/http-api/v1/remove-profile/remove-profile.controller";
import { UpdateProfileController } from "./infrastructure/http-api/v1/update-profile/update-profile.controller";
import { ProfileEntity } from "./infrastructure/persistence/profile.entity";
import { TypeOrmProfileRepository } from "./infrastructure/repositories/typeorm.profile-repository";
import { TypeOrmProfileUserRepository } from "./infrastructure/repositories/typeorm.profile-user-repository";
import { ProfileService } from "./services/profile.service";
import { FindByEmailUseCase } from "./application/profile/find-by-email-use-case/find-by-email.use-case";
import { TypeOrmAdminProfileRepository } from "./infrastructure/repositories/typeorm.admin-profile-repository";
import { AdminProfileRepository } from "./domain/repositories/admin-profile.repository";
import { AdminCreateProfileController } from "./infrastructure/http-api/v1-admin/create-profile/admin-create-profile.controller";
import { AdminUpdateProfileUseCase } from "./application/profile/admin-update-profile-use-case/admin-update-profile.use-case";
import { AdminUpdateProfileController } from "./infrastructure/http-api/v1-admin/admin-update-profile/admin-update-profile.controller";
import { UpdateMyProfileUseCase } from "./application/profile/update-my-profile-use-case/update-my-profile.use-case";
import { UpdateMyProfileController } from "./infrastructure/http-api/auth-me/update-my-profile/update-my-profile.controller";

@Module({
  controllers: [
    CreateProfileController,
    FindAllProfilesController,
    FindOneProfileController,
    UpdateProfileController,
    RemoveProfileController,
    AdminCreateProfileController,
    AdminUpdateProfileController,
    UpdateMyProfileController,
  ],
  providers: [
    ProfileService,

    CreateProfileUseCase,
    AdminCreateProfileUseCase,
    FindAllProfilesUseCase,
    FindOneProfileUseCase,
    UpdateProfileUseCase,
    RemoveProfileUseCase,
    FindByEmailUseCase,
    AdminUpdateProfileUseCase,
    UpdateMyProfileUseCase,

    TypeOrmProfileRepository,
    TypeOrmProfileUserRepository,
    TypeOrmAdminProfileRepository,
    {
      provide: ProfileRepository,
      useExisting: TypeOrmProfileRepository,
    },
    {
      provide: ProfileUserRepository,
      useExisting: TypeOrmProfileUserRepository,
    },
    {
      provide: AdminProfileRepository,
      useExisting: TypeOrmAdminProfileRepository,
    },
  ],
  exports: [ProfileService, ProfileRepository, ProfileUserRepository, AdminProfileRepository, FindByEmailUseCase],
  imports: [
    TypeOrmModule.forFeature([ProfileEntity, User]),
    forwardRef(() => DealershipInvitationModule),
  ],
})
export class ProfileModule {}