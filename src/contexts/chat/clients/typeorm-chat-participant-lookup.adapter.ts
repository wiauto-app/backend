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

