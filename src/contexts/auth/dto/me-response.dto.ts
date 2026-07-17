import { Roles } from "../../roles/entities/roles.entity";
import { AuthProvider, User } from "../../users/entities/user.entity";
import { VehicleListEntity } from "@/src/contexts/vehicles/entities/vehicle-list.entity";
import { PublisherType } from "../../vehicles/types/vehicle";
import { DealershipMembershipDetail } from "@/src/contexts/dealership/types/dealership-membership-detail";

export class MeDealershipMembershipDto {
  dealership_id: string;
  dealership_name: string;
  member_id: string;
  role: "owner" | "admin" | "member";
}

interface MeResponseFromUserOptions {
  providers: AuthProvider[];
  has_password: boolean;
  scope?: "session" | "2fa_challenge";
  dealership_membership?: DealershipMembershipDetail | null;
}

export class MeResponseDto {
  id: string;
  email: string;
  providers: AuthProvider[];
  has_password: boolean;
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
  userType: PublisherType;
  dealership_membership?: MeDealershipMembershipDto | null;
  static fromUser(
    user: User,
    options: MeResponseFromUserOptions,
  ): MeResponseDto {
    const { profile } = user;
    const dto = new MeResponseDto();
    dto.id = user.id;
    dto.email = user.email;
    dto.providers = options.providers;
    dto.has_password = options.has_password;
    dto.last_sign_in = user.last_sign_in;
    dto.created_at = user.created_at;
    dto.name = profile.name;
    dto.last_name = profile.last_name;
    dto.avatar_url = profile.avatar_url;
    dto.image_url = profile.image_url;
    dto.phone_code = profile.phone_code ?? undefined;
    dto.phone = profile.phone ?? undefined;
    dto.dni = profile.dni ?? undefined;
    dto.type = options.scope === "2fa_challenge" ? "2fa_challenge" : "session";
    dto.vehicle_lists = profile.vehicle_lists;
    dto.userType = profile.type;
    dto.dealership_membership = options.dealership_membership
      ? {
          dealership_id: options.dealership_membership.dealership_id,
          dealership_name: options.dealership_membership.dealership_name,
          member_id: options.dealership_membership.member_id,
          role: options.dealership_membership.role,
        }
      : null;
    return dto;
  }
}
