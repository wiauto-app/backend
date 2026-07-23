import { TypeOrmProfileRepository } from "@/src/contexts/profiles/repositories/typeorm.profile-repository";
import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { ChatParticipantSummary } from "../types/chat-participant-summary";

@Injectable()
export class TypeOrmChatParticipantLookupAdapter  {
  constructor(private readonly profile_repository: TypeOrmProfileRepository) {
  }

  async findByIds(ids: string[]): Promise<ChatParticipantSummary[]> {
    if (ids.length === 0) {
      return [];
    }

    const profiles = await this.profile_repository.findByIds(ids);
    return profiles.map((profile) => ({
      id: profile.id,
      name: profile.name,
      last_name: profile.last_name,
      avatar_url: profile.avatar_url,
      email: profile.user?.email,
    }));
  }
}

