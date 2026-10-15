import { Injectable } from "@nestjs/common";

import { ApiResponse } from "@/src/common/types/default.types";
import { ReferralsService } from "@/src/contexts/referrals/services/referrals.service";
import { User } from "../../users/entities/user.entity";
import { UserService } from "../../users/services/user.service";
import { RegisterDto } from "../dto/register.dto";
import { AuthSecurityMailService } from "./auth-security-mail.service";

export interface RegisterApiResponse extends ApiResponse<User> {
  referral_code?: string;
}

@Injectable()
export class RegisterService {
  constructor(
    private readonly userService: UserService,
    private readonly authSecurityMailService: AuthSecurityMailService,
    private readonly referrals_service: ReferralsService,
  ) {}

  async register(registerDto: RegisterDto): Promise<RegisterApiResponse> {
    const result = await this.userService.create({
      email: registerDto.email,
      password: registerDto.password,
      name: registerDto.name,
      last_name: registerDto.last_name,
      phone_code: registerDto.phone_code,
      phone: registerDto.phone,
      referral_code: registerDto.referral_code,
    });

    this.authSecurityMailService.enqueueNewUserRegistered({
      email: registerDto.email,
      name: registerDto.name,
      last_name: registerDto.last_name,
      phone_code: registerDto.phone_code,
      phone: registerDto.phone,
      created_at: result.data?.created_at,
    });

    const user_id = result.data?.id;
    let referral_code: string | undefined;

    if (user_id) {
      referral_code = await this.referrals_service.ensureReferralCodeForProfile(
        user_id,
      );
    }

    return {
      ...result,
      referral_code,
    };
  }
}
