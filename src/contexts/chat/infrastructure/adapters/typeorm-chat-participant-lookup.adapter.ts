import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { ProfileRepository } from "@/src/contexts/profiles/domain/repositories/profile.repository";
import { ChatParticipantLookupPort } from "../../application/ports/chat-participant-lookup.port";
import { ChatParticipantSummary } from "../../domain/read-models/chat-participant-summary";

@Injectable()
export class TypeOrmChatParticipantLookupAdapter extends ChatParticipantLookupPort {
  constructor(private readonly profile_repository: ProfileRepository) {
    super();
  }

  async findByIds(ids: string[]): Promise<ChatParticipantSummary[]> {
    if (ids.length === 0) {
      return [];
    }

    const profiles = await this.profile_repository.findByIds(ids);
    return profiles.map((profile) => {
      const primitive = profile.toPrimitives();
      return {
        id: primitive.id,
        name: primitive.name,
        last_name: primitive.last_name,
        avatar_url: primitive.avatar_url,
        email: primitive.user?.email,
      };
    });
  }
}

