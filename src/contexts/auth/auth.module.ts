import { forwardRef, Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { BullModule } from "@nestjs/bullmq";
import { envs } from "@/src/common/envs";
import { UserModule } from "../users/user.module";
import { AuthController } from "./api/auth.controller";
import { AdminAuthController } from "./api/admin-auth.controller";
import { AuthService } from "./services/auth.service";

import { GoogleTokenService } from "./services/google-token.service";
import { GoogleStrategy } from "./strategies/google.strategy";
import { GoogleAuthGuard } from "./guards/google-auth.guard";

import { AppleTokenService } from "./services/apple-token.service";
import { AppleStrategy } from "./strategies/apple.strategy";
import { AppleAuthGuard } from "./guards/apple-auth.guard";

import { JwtStrategy } from "./strategies/jwt.strategy";
import { JwtGuard } from "./guards/auth.guard";
import { AdminGuard } from "./guards/admin.guard";
import { OptionalJwtGuard } from "./guards/optional-jwt.guard";
import { MeService } from "./services/me.service";
import { AccountSettingsService } from "./services/account-settings.service";
import { MeController } from "./api/me.controller";
import { PasswordRecoveryController } from "./api/password-recovery.controller";
import { PasswordRecoveryService } from "./services/password-recovery.service";
import { EmailVerificationController } from "./api/email-verification.controller";
import { EmailVerificationService } from "./services/email-verification.service";
import { ProfileModule } from "../profiles/profile.module";
import { User } from "../users/entities/user.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EmailVerificationQueue } from "./queues/email-verification.queue";
import { EMAIL_VERIFICATION_QUEUE } from "./queues/email-verification.queue.constants";
import { RefreshTokenEntity } from "./entities/refresh-token.entity";
import { SessionEntity } from "./entities/session.entity";
import { RefreshTokenService } from "./services/refresh-token.service";
import { SessionService } from "./services/session.service";
import { AdminLoginService } from "./services/admin-login.service";
import { TwoFactorLoginService } from "./services/two-factor-login.service";
import { TwoFactorChallengeScopeGuard } from "./guards/two-factor-challenge-scope.guard";
import { RefreshTokenGuard } from "./guards/refresh-token.guard";
import { TwoFactorAuthModule } from "../2fa/2fa.module";
import { RegisterService } from "./services/register.service";
import { AuthSessionService } from "./services/auth-session.service";
import { AuthSecurityMailService } from "./services/auth-security-mail.service";
import { ProfileEntity } from "../profiles/entities/profile.entity";
import { DealershipInvitationModule } from "../dealership/modules/dealership-invitation.module";
import { BillingModule } from "../billing/billing.module";
import { VehicleSearchModule } from "../vehicles/search/vehicle-search.module";
import { VehicleEntity } from "../vehicles/entities/vehicle.entity";

@Module({
  controllers: [
    AuthController,
    AdminAuthController,
    MeController,
    PasswordRecoveryController,
    EmailVerificationController,
  ],
  providers: [
    AuthService,
    AuthSessionService,
    AuthSecurityMailService,
    GoogleTokenService,
    AppleTokenService,
    JwtStrategy,
    GoogleStrategy,
    AppleStrategy,
    JwtGuard,
    OptionalJwtGuard,
    GoogleAuthGuard,
    AppleAuthGuard,
    RefreshTokenGuard,
    AdminGuard,

    MeService,
    AccountSettingsService,
    PasswordRecoveryService,
    EmailVerificationService,
    EmailVerificationQueue,
    SessionService,
    RefreshTokenService,
    AdminLoginService,
    TwoFactorLoginService,
    TwoFactorChallengeScopeGuard,
    RegisterService,
  ],
  imports: [
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.register({
      secret: envs.JWT_SECRET,
      signOptions: {
        expiresIn: envs.ACCESS_TOKEN_EXPIRES_IN as any,
      },
    }),
    forwardRef(() => UserModule),
    forwardRef(() => ProfileModule),
    forwardRef(() => TwoFactorAuthModule),
    DealershipInvitationModule,

    TypeOrmModule.forFeature([
      User,
      SessionEntity,
      RefreshTokenEntity,
      ProfileEntity,
      VehicleEntity,
    ]),
    BullModule.registerQueue({ name: EMAIL_VERIFICATION_QUEUE }),
    BillingModule,
    VehicleSearchModule,
  ],
  exports: [
    JwtGuard,
    OptionalJwtGuard,
    GoogleAuthGuard,
    AdminGuard,
    AuthService,
    AuthSecurityMailService,
    EmailVerificationService /*, AppleAuthGuard*/,
  ],
})
export class AuthModule { }
