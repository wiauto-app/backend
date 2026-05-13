import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";
import { ProfileFilter } from "../filters/profile.filter";
import { Profile } from "../entities/profile";

export abstract class ProfileRepository {
  abstract findByEmail(email: string): Promise<Profile | null>;
  abstract save(profile: Profile): Promise<void>;
  abstract exists(id: string): Promise<boolean>;
  abstract findAll(filter: ProfileFilter): Promise<PaginatedResult<Profile>>;
  abstract findOne(id: string): Promise<Profile | null>;
  abstract update(profile: Profile): Promise<void>;
  abstract delete(id: string): Promise<void>;
}
