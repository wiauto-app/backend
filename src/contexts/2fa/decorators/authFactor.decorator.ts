import { applyDecorators, UseGuards } from "@nestjs/common";
import { JwtGuard } from "../../auth/guards/auth.guard";
import { TwoFactorGuard } from "../guards/2fa.guard";


export const AuthFactor = () => {
  return applyDecorators(
    UseGuards(JwtGuard, TwoFactorGuard)
  )
}