import { Body, Controller, Get, Patch, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";

import { GetUser } from "../decorators/GetUser.decorator";
import { GetUserId } from "../decorators/GetUserId.decorator";
import { MeUpdateEmailHttpDto } from "../dto/me-update-email.http-dto";
import { MeUpdatePasswordHttpDto } from "../dto/me-update-password.http-dto";
import { MeResponseDto } from "../dto/me-response.dto";
import { JwtGuard } from "../guards/auth.guard";
import { AccountSettingsService } from "../services/account-settings.service";
import { MeService } from "../services/me.service";
import { User } from "../../users/entities/user.entity";
import { UserService } from "../../users/services/user.service";
import { EmailVerificationService } from "../services/email-verification.service";

@Controller("/auth/me")
@UseGuards(JwtGuard)
export class MeController {
  constructor(
    private readonly me_service: MeService,
    private readonly account_settings_service: AccountSettingsService,
    private readonly user_service: UserService,
    private readonly email_verification_service: EmailVerificationService,
  ) { }

  @Get()
  getMe(@GetUser() user: User, @Req() req: Request): MeResponseDto {
    return this.me_service.getMe(user, req.auth_scope);
  }

  @Get("account")
  getAccountSettings(@GetUserId() user_id: string) {
    return this.account_settings_service.getAccountSettings(user_id);
  }


  @Patch("email")
  async updateEmail(
    @GetUserId() user_id: string,
    @Body() me_update_email_http_dto: MeUpdateEmailHttpDto,
  ) {
    const response = await this.user_service.updateEmail(
      { email: me_update_email_http_dto.email },
      user_id,
    );

    void this.email_verification_service
      .enqueueSendVerificationForUser(user_id, me_update_email_http_dto.email)

    return response;
  }

  @Patch("password")
  updatePassword(
    @GetUserId() user_id: string,
    @Body() me_update_password_http_dto: MeUpdatePasswordHttpDto,
  ) {
    return this.user_service.updatePassword(
      {
        current_password: me_update_password_http_dto.current_password,
        password: me_update_password_http_dto.password,
      },
      user_id,
    );
  }
}
