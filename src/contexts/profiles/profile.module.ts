import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "../users/entities/user.entity";
import { ProfilesController } from "./api/v1/profiles.controller";
import { Profile } from "./entities/profile.entity";
import { ProfileService } from "./services/profile.service";

@Module({
  controllers: [ProfilesController],
  providers: [ProfileService],
  exports: [ProfileService],
  imports: [TypeOrmModule.forFeature([Profile, User])],
})
export class ProfileModule {}