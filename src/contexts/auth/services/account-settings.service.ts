import { Injectable } from "@nestjs/common";

import { AccountSettingsResponseDto } from "../dto/account-settings-response.dto";
import { UserService } from "../../users/services/user.service";

@Injectable()
export class AccountSettingsService {
  constructor(private readonly user_service: UserService) {}

  async getAccountSettings(user_id: string): Promise<AccountSettingsResponseDto> {
    const user = await this.user_service.findOne(user_id);
    const backup_codes_remaining =
      await this.user_service.getBackupCodesRemaining(user_id);

    return AccountSettingsResponseDto.fromUser(user, backup_codes_remaining);
  }
}
