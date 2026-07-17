import type { AuthProvider } from "@/src/contexts/users/entities/user.entity";

import { CreateProfilePayload } from "../types/create-profile.payload";
import { UpdateProfilePayload } from "../types/update-profile.payload";

export interface PrimitiveProfileRole {
  id: string;
  name: string;
  is_admin: boolean;
  is_developer: boolean;
  is_default: boolean;
}

export interface PrimitiveUser {
  id: string;
  email: string;
  providers: AuthProvider[];
  has_password: boolean;
  last_sign_in: Date;
  is_email_verified: boolean;
  two_factor_enabled: boolean;
  is_suspended: boolean;
  suspension_reason: string | null;
  suspension_end_time: Date | null;
  suspended_at: Date | null;
  created_at: string;
}
export interface PrimitiveProfile {
  id: string;
  name: string ;
  last_name?: string ;
  avatar_url?: string ;
  image_url?: string ;
  role_id: string ;
  role?: PrimitiveProfileRole | null;
  user?: PrimitiveUser | null;
  phone_code?: string;
  phone?: string;
  dni?: string;
}

export class Profile {
  constructor(private readonly primitive_profile: PrimitiveProfile) { }

  static create(payload: CreateProfilePayload): Profile {
    return new Profile({
      id: payload.id,
      name: payload.name,
      last_name: payload.last_name,
      avatar_url: payload.avatar_url ,
      image_url: payload.image_url ,
      role_id: payload.role_id,
      role: null,
    });
  }

  update(payload: UpdateProfilePayload): Profile {
    return new Profile({
      ...this.primitive_profile,
      ...payload,
    });
  }

  fill_missing_names(payload: Pick<UpdateProfilePayload, "name" | "last_name">): Profile {
    const current_name = this.primitive_profile.name;
    const current_last_name = this.primitive_profile.last_name;
    const should_fill_name =
      current_name === "";
    const should_fill_last_name =
      current_last_name === "";

    return new Profile({
      ...this.primitive_profile,
      name: should_fill_name ? (payload.name ?? current_name) : current_name,
      last_name: should_fill_last_name
        ? (payload.last_name ?? current_last_name)
        : current_last_name,
    });
  }

  has_same_names(profile: Profile): boolean {
    const current = this.toPrimitives();
    const next = profile.toPrimitives();
    return current.name === next.name && current.last_name === next.last_name;
  }

  static fromPrimitives(primitive: PrimitiveProfile): Profile {
    return new Profile(primitive);
  }

  toPrimitives(): PrimitiveProfile {
    return { ...this.primitive_profile };
  }
}
