import type { AuthProvider } from "@/src/contexts/users/entities/user.entity";
import type { User } from "@/src/contexts/users/entities/user.entity";

import type { ProfileEntity } from "../entities/profile.entity";

export interface ProfileRoleResponse {
  id: string;
  name: string;
  is_admin: boolean;
  is_developer: boolean;
  is_default: boolean;
}

export interface ProfileUserResponse {
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
  created_at: Date | string;
}

/** Forma de respuesta HTTP / API (sin clase de dominio). */
export interface ProfileResponse {
  id: string;
  name: string;
  last_name?: string;
  avatar_url?: string;
  image_url?: string;
  role_id: string;
  role?: ProfileRoleResponse | null;
  user?: ProfileUserResponse | null;
  phone_code?: string | null;
  phone?: string | null;
  dni?: string | null;
}

const resolveUserProviders = (
  user: User,
): Pick<ProfileUserResponse, "providers" | "has_password"> => {
  const has_password = Boolean(user.password);
  const providers: AuthProvider[] = [];

  if (has_password) {
    providers.push("local");
  }

  for (const identity of user.auth_providers ?? []) {
    providers.push(identity.provider);
  }

  return { providers, has_password };
};

export const mapUserToResponse = (user: User): ProfileUserResponse => {
  const identity = resolveUserProviders(user);

  return {
    id: user.id,
    email: user.email,
    providers: identity.providers,
    has_password: identity.has_password,
    last_sign_in: user.last_sign_in,
    is_email_verified: user.is_email_verified,
    two_factor_enabled: user.two_factor_enabled,
    is_suspended: user.is_suspended,
    suspension_reason: user.suspension_reason,
    suspension_end_time: user.suspension_end_time,
    suspended_at: user.suspended_at,
    created_at: user.created_at,
  };
};

export const mapProfileToResponse = (
  entity: ProfileEntity,
): ProfileResponse => ({
  id: entity.id,
  name: entity.name,
  last_name: entity.last_name,
  avatar_url: entity.avatar_url,
  image_url: entity.image_url,
  role_id: entity.role_id ?? entity.role?.id ?? "",
  phone_code: entity.phone_code,
  phone: entity.phone,
  dni: entity.dni,
  role: entity.role
    ? {
        id: entity.role.id,
        name: entity.role.name,
        is_admin: entity.role.is_admin,
        is_developer: entity.role.is_developer,
        is_default: entity.role.is_default,
      }
    : null,
  user: entity.user ? mapUserToResponse(entity.user) : null,
});
