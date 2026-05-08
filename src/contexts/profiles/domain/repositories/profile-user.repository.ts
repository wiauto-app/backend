export abstract class ProfileUserRepository {
  abstract exists(id: string): Promise<boolean>;
  abstract existsByEmail(email: string): Promise<boolean>;
  abstract findEmailById(id: string): Promise<string | null>;
}
