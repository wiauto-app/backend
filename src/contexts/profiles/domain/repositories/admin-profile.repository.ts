import { Profile } from "../entities/profile";


export abstract class AdminProfileRepository{
  abstract create(profile: Profile): Promise<void>;
  abstract findOne(id: string): Promise<Profile | null>;
  abstract update(profile: Profile): Promise<void>;
}