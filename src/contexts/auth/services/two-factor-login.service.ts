import { Injectable } from "@nestjs/common";

import { TwofaDto } from "../../2fa/dto/2fa.dto";
import { TwoFactorAuthService } from "../../2fa/services/2fa.service";
import { UserService } from "../../users/services/user.service";
import { SessionPayload } from "../types/auth.types";
import { AuthSecurityMailService } from "./auth-security-mail.service";
import { AuthService } from "./auth.service";
import { SessionService } from "./session.service";

@Injectable()
export class TwoFactorLoginService {
  constructor(
    private readonly auth_service: AuthService,
    private readonly two_factor_auth_service: TwoFactorAuthService,
    private readonly user_service: UserService,
    private readonly session_service: SessionService,
    private readonly auth_security_mail_service: AuthSecurityMailService,
  ) {}

  async verifyTotpChallenge(
    user_id: string,
    twofa_dto: TwofaDto,
    session_payload: SessionPayload,
  ) {
    await this.two_factor_auth_service.verify(user_id, twofa_dto);
    return this.completeVerifiedChallenge(user_id, session_payload);
  }

  async verifyBackupCodeChallenge(
    user_id: string,
    code: string,
    session_payload: SessionPayload,
  ) {
    await this.two_factor_auth_service.consumeBackupCode(user_id, code);
    return this.completeVerifiedChallenge(user_id, session_payload);
  }

  getChallengeStatus(email: string) {
    return {
      email,
      type: "2fa_required" as const,
    };
  }

  private async completeVerifiedChallenge(
    user_id: string,
    session_payload: SessionPayload,
  ) {
    const user = await this.user_service.findOne(user_id);
    const token = this.auth_service.createVerifiedSessionToken({
      user,
      session_id: session_payload.session_id,
      refresh_token_hash: session_payload.refreshToken_hash,
    });

    if (session_payload.notify_new_login) {
      const session = await this.session_service.findOne(session_payload.session_id);
      const role = user.profile?.role;
      const audience =
        role?.is_admin || role?.is_developer ? "admin" : "platform";

      this.auth_security_mail_service.enqueueNewLogin({
        to: user.email,
        ip_address: session.ip_address,
        user_agent: session.user_agent,
        audience,
      });
    }

    return { type: "session" as const, token };
  }
}
