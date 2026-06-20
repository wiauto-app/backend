import { Injectable } from "@nestjs/common";

import { TwofaDto } from "../../2fa/dto/2fa.dto";
import { TwoFactorAuthService } from "../../2fa/services/2fa.service";
import { SessionPayload } from "../types/auth.types";
import { AuthService } from "./auth.service";
import { UserService } from "../../users/services/user.service";

@Injectable()
export class TwoFactorLoginService {
  constructor(
    private readonly auth_service: AuthService,
    private readonly two_factor_auth_service: TwoFactorAuthService,
    private readonly user_service: UserService,
  ) {}

  async verifyTotpChallenge(
    user_id: string,
    twofa_dto: TwofaDto,
    session_payload: SessionPayload,
  ) {
    await this.two_factor_auth_service.verify(user_id, twofa_dto);

    const user = await this.user_service.findOne(user_id);
    const token = this.auth_service.createVerifiedSessionToken({
      user,
      session_id: session_payload.session_id,
      refresh_token_hash: session_payload.refreshToken_hash,
    });

    return { type: "session" as const, token };
  }

  async verifyBackupCodeChallenge(
    user_id: string,
    code: string,
    session_payload: SessionPayload,
  ) {
    await this.two_factor_auth_service.consumeBackupCode(user_id, code);

    const user = await this.user_service.findOne(user_id);
    const token = this.auth_service.createVerifiedSessionToken({
      user,
      session_id: session_payload.session_id,
      refresh_token_hash: session_payload.refreshToken_hash,
    });

    return { type: "session" as const, token };
  }

  getChallengeStatus(email: string) {
    return {
      email,
      type: "2fa_required" as const,
    };
  }
}
