import { Module } from "@nestjs/common";
import { ProfileService } from "./services/profile.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Profile } from "./entities/profile.entity";


@Module({
  controllers:[],
  providers:[ProfileService],
  exports:[ProfileService],
  imports:[TypeOrmModule.forFeature([Profile])]
})
export class ProfileModule{}