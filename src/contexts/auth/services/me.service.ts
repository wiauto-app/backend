import { Injectable } from "@nestjs/common";

import { MeResponseDto } from "../dto/me-response.dto";
import { UserResponse } from "../types/auth.types";

@Injectable()
export class MeService {
  getMe(user: UserResponse): MeResponseDto {
    return MeResponseDto.fromUser(user);
  }
}
