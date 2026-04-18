import { Body, Controller, Delete, Get, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../../auth/guards/auth.guard";
import { TwoFactorAuthService } from "../services/2fa.service";
import { GetUser } from "../../auth/decorators/GetUser.decorator";
import { UserResponse } from "../../auth/types/auth.types";
import { TwoFactorGuard } from "../guards/2fa.guard";
import { ValidateBackupCodeDto } from "../dto/validate-backup-code.dto";

@Controller("2fa")
export class TwoFactorAuthController {

  constructor(
    private readonly twoFactorAuthService: TwoFactorAuthService,
  ) { }

  @UseGuards(AuthGuard)
  @Get("setup")
  setup(@GetUser() { user: { id } }: UserResponse) {
    return this.twoFactorAuthService.setup(id);
  }

  @UseGuards(AuthGuard, TwoFactorGuard)
  @Post("activate")
  activate(@GetUser() { user: { id } }: UserResponse) {
    return this.twoFactorAuthService.activate(id)
  }

  @Post("enable")
  enable(@GetUser() { user: { id } }: UserResponse) {
    return this.twoFactorAuthService.enable(id)
  }

  @UseGuards(AuthGuard, TwoFactorGuard)
  @Post("disable")
  disable(@GetUser() { user: { id } }: UserResponse) {
    return this.twoFactorAuthService.disable(id)
  }

  @UseGuards(AuthGuard, TwoFactorGuard)
  @Delete("delete")
  delete(@GetUser() { user: { id } }: UserResponse) {
    return this.twoFactorAuthService.delete(id)
  }

  @Post("validate-backup-code")
  validateBackupCode(@Body() dto: ValidateBackupCodeDto) {
    return this.twoFactorAuthService.validateBackupCode(dto)
  }

  @UseGuards(AuthGuard)
  @Get("regenerate-backup-codes")
  regenerateBackupCodes(@GetUser() { user: { id } }: UserResponse) {
    return this.twoFactorAuthService.regenerateBackupCodes(id)
  }
}