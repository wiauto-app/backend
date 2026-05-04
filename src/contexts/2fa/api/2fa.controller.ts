import { Body, Controller, Delete, Get, Post, UseGuards } from "@nestjs/common";
import { JwtGuard } from "../../auth/guards/auth.guard";
import { TwoFactorAuthService } from "../services/2fa.service";
import { GetUser } from "../../auth/decorators/GetUser.decorator";
import { UserResponse } from "../../auth/types/auth.types";
import { ValidateBackupCodeDto } from "../dto/validate-backup-code.dto";
import { AuthFactor } from "../decorators/authFactor.decorator";

@Controller("2fa")
export class TwoFactorAuthController {

  constructor(
    private readonly twoFactorAuthService: TwoFactorAuthService,
  ) { }

  @UseGuards(JwtGuard)
  @Get("setup")
  setup(@GetUser() { user: { id } }: UserResponse) {
    return this.twoFactorAuthService.setup(id);
  }

  @AuthFactor()
  @Post("activate")
  activate(@GetUser() { user: { id } }: UserResponse) {
    return this.twoFactorAuthService.activate(id)
  }

  @Post("enable")
  enable(@GetUser() { user: { id } }: UserResponse) {
    return this.twoFactorAuthService.enable(id)
  }

  @AuthFactor()
  @Post("disable")
  disable(@GetUser() { user: { id } }: UserResponse) {
    return this.twoFactorAuthService.disable(id)
  }

  @AuthFactor()
  @Delete("delete")
  delete(@GetUser() { user: { id } }: UserResponse) {
    return this.twoFactorAuthService.delete(id)
  }

  @Post("validate-backup-code")
  validateBackupCode(@Body() dto: ValidateBackupCodeDto) {
    return this.twoFactorAuthService.validateBackupCode(dto)
  }

  @UseGuards(JwtGuard)
  @Get("regenerate-backup-codes")
  regenerateBackupCodes(@GetUser() { user: { id } }: UserResponse) {
    return this.twoFactorAuthService.regenerateBackupCodes(id)
  }
}