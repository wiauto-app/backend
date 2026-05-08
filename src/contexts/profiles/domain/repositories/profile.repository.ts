import { Profile } from "../entities/profile";

export abstract class ProfileRepository {
  abstract save(profile: Profile): Promise<void>;
  abstract exists(id: string): Promise<boolean>;
  abstract findAll(): Promise<Profile[]>;
  abstract findOne(id: string): Promise<Profile | null>;
  abstract update(profile: Profile): Promise<void>;
  abstract delete(id: string): Promise<void>;
}
