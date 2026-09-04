import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Patch, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";

import { GetSessionId } from "../decorators/GetSessionId.decorator";
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
  async getMe(@GetUser() user: User, @Req() req: Request): Promise<MeResponseDto> {
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

    await this.me_service.invalidateMeCache(user_id);

    void this.email_verification_service
      .enqueueSendVerificationForUser(user_id, me_update_email_http_dto.email)

    return response;
  }

  @Patch("password")
  async updatePassword(
    @GetUserId() user_id: string,
    @Body() me_update_password_http_dto: MeUpdatePasswordHttpDto,
  ) {
    const response = await this.user_service.updatePassword(
      {
        current_password: me_update_password_http_dto.current_password,
        password: me_update_password_http_dto.password,
      },
      user_id,
    );

    await this.me_service.invalidateMeCache(user_id);

    return response;
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  deleteAccount(
    @GetUserId() user_id: string,
    @GetSessionId() session_id: string,
  ) {
    return this.me_service.deleteAccount(user_id, session_id);
  }
}
