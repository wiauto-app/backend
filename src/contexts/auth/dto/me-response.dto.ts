import { Roles } from "../../roles/entities/roles.entity";
import { AuthProvider, User } from "../../users/entities/user.entity";
import { VehicleListEntity } from "@/src/contexts/vehicles/infrastructure/persistence/vehicle-list.entity";

export class MeResponseDto {
  id: string;
  email: string;
  provider: AuthProvider;
  name?: string;
  last_name?: string;
  avatar_url?: string;
  image_url?: string;
  phone_code?: string;
  phone?: string;
  dni?: string | null;
  last_sign_in: Date | null;
  vehicle_lists: VehicleListEntity[];
  role: Roles;
  created_at: string;
  type: "session" | "2fa_challenge";

  static fromUser(
    user: User,
    scope?: "session" | "2fa_challenge",
  ): MeResponseDto {
    const { profile } = user;
    const dto = new MeResponseDto();
    dto.id = user.id;
    dto.email = user.email;
    dto.provider = user.provider;
    dto.last_sign_in = user.last_sign_in;
    dto.created_at = user.created_at;
    dto.name = profile.name;
    dto.last_name = profile.last_name;
    dto.avatar_url = profile.avatar_url;
    dto.image_url = profile.image_url;
    dto.phone_code = profile.phone_code ?? undefined;
    dto.phone = profile.phone ?? undefined;
    dto.dni = profile.dni ?? undefined;
    dto.type = scope === "2fa_challenge" ? "2fa_challenge" : "session";
    dto.vehicle_lists = profile.vehicle_lists;
    return dto;
  }
}
