import { Module } from "@nestjs/common";
import { TwoFactorAuthController } from "./api/2fa.controller";
import { TwoFactorAuthService } from "./services/2fa.service";
import { UserModule } from "../users/user.module";
import { CryptoService } from "./services/crypto.service";
import { BackupCodeService } from "./services/backup-code.service";
import { AuthModule } from "../auth/auth.module";

@Module({
  controllers: [TwoFactorAuthController],
  providers: [TwoFactorAuthService, CryptoService, BackupCodeService],
  imports: [UserModule, AuthModule],
  exports: [TwoFactorAuthService],
})
export class TwoFactorAuthModule {}