import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DealershipInvitationModule } from "../dealership/modules/dealership-invitation.module";
import { User } from "../users/entities/user.entity";
import { AdminCreateProfileUseCase } from "./application/profile/admin-create-profile-use-case/admin-create-profile.use-case";
import { CreateProfileUseCase } from "./application/profile/create-profile-use-case/create-profile.use-case";
import { FillMissingProfileNamesUseCase } from "./application/profile/fill-missing-profile-names-use-case/fill-missing-profile-names.use-case";
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

@Module({
  controllers: [
    CreateProfileController,
    FindAllProfilesController,
    FindOneProfileController,
    UpdateProfileController,
    RemoveProfileController,
  ],
  providers: [
    ProfileService,
    CreateProfileUseCase,
    AdminCreateProfileUseCase,
    FindAllProfilesUseCase,
    FindOneProfileUseCase,
    UpdateProfileUseCase,
    RemoveProfileUseCase,
    FillMissingProfileNamesUseCase,
    FindByEmailUseCase,
    TypeOrmProfileRepository,
    TypeOrmProfileUserRepository,
    {
      provide: ProfileRepository,
      useExisting: TypeOrmProfileRepository,
    },
    {
      provide: ProfileUserRepository,
      useExisting: TypeOrmProfileUserRepository,
    },
  ],
  exports: [ProfileService, ProfileRepository, ProfileUserRepository, FindByEmailUseCase],
  imports: [
    TypeOrmModule.forFeature([ProfileEntity, User]),
    forwardRef(() => DealershipInvitationModule),
  ],
})
export class ProfileModule {}