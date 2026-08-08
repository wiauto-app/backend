import { applyDecorators, UseGuards } from "@nestjs/common";

import { AdminGuard } from "../guards/admin.guard";
import { JwtGuard } from "../guards/auth.guard";

/** JWT + AdminGuard (`users.is_admin`). */
export const AuthAdmin = (): MethodDecorator & ClassDecorator =>
  applyDecorators(UseGuards(JwtGuard, AdminGuard));
