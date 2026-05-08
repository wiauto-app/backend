import { CreateProfilePayload } from "../payloads/create-profile.payload";
import { UpdateProfilePayload } from "../payloads/update-profile.payload";

export interface PrimitiveProfileRole {
  id: string;
  name: string;
  is_admin: boolean;
  is_developer: boolean;
  is_default: boolean;
}

export interface PrimitiveProfile {
  id: string;
  name?: string | null;
  last_name?: string | null;
  avatar_url?: string | null;
  image_url?: string | null;
  role_id?: string | null;
  role?: PrimitiveProfileRole | null;
}

export class Profile {
  constructor(private readonly primitive_profile: PrimitiveProfile) {}

  static create(payload: CreateProfilePayload): Profile {
    return new Profile({
      id: payload.id,
      name: payload.name ?? null,
      last_name: payload.last_name ?? null,
      avatar_url: payload.avatar_url ?? null,
      image_url: payload.image_url ?? null,
      role_id: payload.role_id ?? null,
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
      current_name === null || current_name === undefined || current_name === "";
    const should_fill_last_name =
      current_last_name === null || current_last_name === undefined || current_last_name === "";

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
