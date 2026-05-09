import { Body, Controller, Delete, Get, Post, Req, UseGuards } from "@nestjs/common";
import { JwtGuard } from "../../auth/guards/auth.guard";
import { TwoFactorAuthService } from "../services/2fa.service";
import { ValidateBackupCodeDto } from "../dto/validate-backup-code.dto";
import { AuthFactor } from "../decorators/authFactor.decorator";
import { Request } from "express";
import { GetUserId } from "../../auth/decorators/GetUserId.decorator";

@Controller("2fa")
export class TwoFactorAuthController {

  constructor(
    private readonly twoFactorAuthService: TwoFactorAuthService,
  ) { }

  @UseGuards(JwtGuard)
  @Get("setup")
  setup(@GetUserId() id: string) {
    return this.twoFactorAuthService.setup(id);
  }

  @AuthFactor()
  @Post("activate")
  activate(@GetUserId() id: string) {
    return this.twoFactorAuthService.activate(id)
  }

  @Post("enable")
  enable(@GetUserId() id: string) {
    return this.twoFactorAuthService.enable(id)
  }

  @AuthFactor()
  @Post("disable")
  disable(@GetUserId() id: string) {
    return this.twoFactorAuthService.disable(id)
  }

  @AuthFactor()
  @Delete("delete")
  delete(@GetUserId() id: string) {
    return this.twoFactorAuthService.delete(id)
  }

  @Post("validate-backup-code")
  validateBackupCode(@Body() dto: ValidateBackupCodeDto, @Req() req: Request) {
    return this.twoFactorAuthService.validateBackupCode(dto, req)
  }

  @UseGuards(JwtGuard)
  @Get("regenerate-backup-codes")
  regenerateBackupCodes(@GetUserId() id: string) {
    return this.twoFactorAuthService.regenerateBackupCodes(id)
  }
}