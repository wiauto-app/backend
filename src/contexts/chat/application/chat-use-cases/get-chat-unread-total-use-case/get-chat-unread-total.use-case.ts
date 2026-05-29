import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { ChatParticipantStateRepository } from "../../../domain/repositories/chat-participant-state.repository";
import { GetChatUnreadTotalDto } from "./get-chat-unread-total.dto";

@Injectable()
export class GetChatUnreadTotalUseCase {
  constructor(
    private readonly chat_participant_state_repository: ChatParticipantStateRepository,
  ) {}

  async execute(dto: GetChatUnreadTotalDto): Promise<{ total: number }> {
    const total = await this.chat_participant_state_repository.getUnreadTotal(dto.user_id);
    return { total };
  }
}
