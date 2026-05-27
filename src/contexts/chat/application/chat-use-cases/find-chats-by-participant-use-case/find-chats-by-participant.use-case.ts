import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { PaginationFilter } from "@/src/contexts/shared/domain/filters/pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";

import { Chat } from "../../../domain/entities/chat";
import { ChatRepository } from "../../../domain/repositories/chat.repository";
import { FindChatsByParticipantDto } from "./find-chats-by-participant.dto";

@Injectable()
export class FindChatsByParticipantUseCase {
  constructor(private readonly chat_repository: ChatRepository) {}

  async execute(
    find_chats_by_participant_dto: FindChatsByParticipantDto,
  ): Promise<PaginatedResult<Chat>> {
    const pagination_filter = new PaginationFilter(
      find_chats_by_participant_dto.page,
      find_chats_by_participant_dto.limit,
      find_chats_by_participant_dto.order_direction ?? "ASC",
      find_chats_by_participant_dto.query,
      find_chats_by_participant_dto.order_by,
      find_chats_by_participant_dto.search,
    );

    return this.chat_repository.findByParticipantId(
      find_chats_by_participant_dto.participant_id,
      pagination_filter,
    );
  }
}
