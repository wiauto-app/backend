import { AuthProvider, User } from "../../users/entities/user.entity";

interface AccountSettingsFromUserOptions {
  providers: AuthProvider[];
  has_password: boolean;
  backup_codes_remaining: number;
}

export class AccountSettingsResponseDto {
  id: string;
  email: string;
  providers: AuthProvider[];
  has_password: boolean;
  name: string;
  last_name: string | null;
  avatar_url: string | null;
  last_sign_in: Date | null;
  created_at: string;
  two_factor_enabled: boolean;
  is_email_verified: boolean;
  backup_codes_remaining: number;

  static fromUser(
    user: User,
    options: AccountSettingsFromUserOptions,
  ): AccountSettingsResponseDto {
    const dto = new AccountSettingsResponseDto();
    const { profile } = user;

    dto.id = user.id;
    dto.email = user.email;
    dto.providers = options.providers;
    dto.has_password = options.has_password;
    dto.last_sign_in = user.last_sign_in;
    dto.created_at = user.created_at;
    dto.two_factor_enabled = user.two_factor_enabled;
    dto.is_email_verified = user.is_email_verified;
    dto.backup_codes_remaining = options.backup_codes_remaining;
    dto.name = profile?.name ?? "";
    dto.last_name = profile?.last_name ?? null;
    dto.avatar_url = profile?.avatar_url ?? null;

    return dto;
  }
}
