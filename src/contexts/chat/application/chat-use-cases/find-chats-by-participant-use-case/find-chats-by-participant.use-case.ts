import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { PaginationFilter } from "@/src/contexts/shared/domain/filters/pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";

import { ChatListItem } from "../../../domain/read-models/chat-list-item";
import { ChatRepository } from "../../../domain/repositories/chat.repository";
import { ChatReadModelService } from "../../services/chat-read-model.service";
import { FindChatsByParticipantDto } from "./find-chats-by-participant.dto";

@Injectable()
export class FindChatsByParticipantUseCase {
  constructor(
    private readonly chat_repository: ChatRepository,
    private readonly chat_read_model_service: ChatReadModelService,
  ) {}

  async execute(
    find_chats_by_participant_dto: FindChatsByParticipantDto,
  ): Promise<PaginatedResult<ChatListItem>> {
    const pagination_filter = new PaginationFilter(
      find_chats_by_participant_dto.page,
      find_chats_by_participant_dto.limit,
      find_chats_by_participant_dto.order_direction,
      find_chats_by_participant_dto.query,
      find_chats_by_participant_dto.order_by,
      find_chats_by_participant_dto.search,
    );

    const chats = await this.chat_repository.findByParticipantsIds(
      find_chats_by_participant_dto.participants_ids,
      pagination_filter,
    );
    return this.chat_read_model_service.toChatList(
      chats,
      find_chats_by_participant_dto.requesting_user_id,
    );
  }
}
