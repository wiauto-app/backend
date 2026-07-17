import { Injectable } from "@nestjs/common";

import { AccountSettingsResponseDto } from "../dto/account-settings-response.dto";
import { UserService } from "../../users/services/user.service";
import { UserAuthProviderService } from "../../users/services/user-auth-provider.service";

@Injectable()
export class AccountSettingsService {
  constructor(
    private readonly user_service: UserService,
    private readonly user_auth_provider_service: UserAuthProviderService,
  ) {}

  async getAccountSettings(user_id: string): Promise<AccountSettingsResponseDto> {
    const user = await this.user_service.findOne(user_id);
    const backup_codes_remaining =
      await this.user_service.getBackupCodesRemaining(user_id);
    const identity =
      await this.user_auth_provider_service.getAuthIdentitySummary(user_id);

    return AccountSettingsResponseDto.fromUser(user, {
      providers: identity.providers,
      has_password: identity.has_password,
      backup_codes_remaining,
    });
  }
}
