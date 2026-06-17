import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { ProfileUserRepository } from "@/src/contexts/profiles/domain/repositories/profile-user.repository";

import { AlertProfileContactLookupPort } from "../../application/ports/alert-event-recipient.port";

@Injectable()
export class ProfileUserAlertContactLookupAdapter extends AlertProfileContactLookupPort {
  constructor(
    private readonly profile_user_repository: ProfileUserRepository,
  ) {
    super();
  }

  async findEmailByProfileId(profile_id: string): Promise<string | null> {
    return this.profile_user_repository.findEmailById(profile_id);
  }
}
