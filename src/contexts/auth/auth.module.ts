import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";

import { envs } from "@/src/common/envs";
import { UserModule } from "../users/user.module";
import { AuthController } from "./api/auth.controller";
import { AuthService } from "./services/auth.service";
import { PasswordService } from "./services/password.service";
import { GoogleTokenService } from "./services/google-token.service";
// import { AppleTokenService } from "./services/apple-token.service";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { GoogleStrategy } from "./strategies/google.strategy";
// import { AppleStrategy } from "./strategies/apple.strategy";
import { AuthGuard } from "./guards/auth.guard";
import { GoogleAuthGuard } from "./guards/google-auth.guard";
import { MeService } from "./services/me.service";
import { MeController } from "./api/me.controller";
import { PasswordRecoveryController } from "./api/password-recovery.controller";
import { PasswordRecoveryService } from "./services/password-recovery.service";
import { ProfileModule } from "../profiles/profile.module";
// import { AppleAuthGuard } from "./guards/apple-auth.guard";

@Module({
  controllers: [AuthController, MeController, PasswordRecoveryController],
  providers: [
    AuthService,
    PasswordService,
    GoogleTokenService,
    // AppleTokenService,
    JwtStrategy,
    GoogleStrategy,
    // AppleStrategy,
    AuthGuard,
    GoogleAuthGuard,
    // AppleAuthGuard,

    MeService,
    PasswordRecoveryService,
  ],
  imports: [
    PassportModule.register({ defaultStrategy: "jwt", session: true }),
    JwtModule.register({
      secret: envs.JWT_SECRET,
      signOptions: {
        expiresIn: "30d",
      },
    }),
    UserModule,
    ProfileModule
  ],
  exports: [AuthGuard, GoogleAuthGuard, AuthService /*, AppleAuthGuard*/],
})
export class AuthModule {}
