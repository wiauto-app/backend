import { forwardRef, Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { UserModule } from "../users/user.module";
import { TwoFactorAuthController } from "./api/2fa.controller";
import { BackupCodeService } from "./services/backup-code.service";
import { CryptoService } from "./services/crypto.service";
import { TwoFactorAuthService } from "./services/2fa.service";

@Module({
  controllers: [TwoFactorAuthController],
  providers: [TwoFactorAuthService, CryptoService, BackupCodeService],
  imports: [forwardRef(() => UserModule), forwardRef(() => AuthModule)],
  exports: [TwoFactorAuthService],
})
export class TwoFactorAuthModule { }
