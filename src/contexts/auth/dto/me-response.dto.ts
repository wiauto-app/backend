import { AuthProvider, User } from "../../users/entities/user.entity";

export class MeResponseDto {
  id: string;
  email: string;
  provider: AuthProvider;
  name?: string;
  last_name?: string;
  avatar_url?: string;
  last_sign_in: Date | null;
  created_at: string;
  type: "session" | "2fa_challenge";

  static fromUser(user: User): MeResponseDto {
    const { profile } = user
    const dto = new MeResponseDto();
    dto.id = user.id;
    dto.email = user.email;
    dto.provider = user.provider;
    dto.last_sign_in = user.last_sign_in;
    dto.created_at = user.created_at;
    dto.name = profile.name;
    dto.last_name = profile.last_name
    dto.avatar_url = profile.avatar_url
    dto.type = user.two_factor_enabled ? "2fa_challenge" : "session";
    return dto;
  }
}
