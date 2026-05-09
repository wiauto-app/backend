import { Injectable } from "@nestjs/common";

import { MeResponseDto } from "../dto/me-response.dto";
import { User } from "../../users/entities/user.entity";

@Injectable()
export class MeService {
  getMe(user: User): MeResponseDto {
    return MeResponseDto.fromUser(user);
  }
}
