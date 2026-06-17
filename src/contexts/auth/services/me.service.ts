import { Injectable } from "@nestjs/common";

import { MeResponseDto } from "../dto/me-response.dto";
import { User } from "../../users/entities/user.entity";
import { ProfileEntity } from "../../profiles/infrastructure/persistence/profile.entity";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";

@Injectable()
export class MeService {
  constructor(
    @InjectRepository(ProfileEntity)
    private readonly profileRepository: Repository<ProfileEntity>,
  ) { }
  getMe(user: User, scope?: "session" | "2fa_challenge"): MeResponseDto {
    return MeResponseDto.fromUser(user, scope);
  }

}
