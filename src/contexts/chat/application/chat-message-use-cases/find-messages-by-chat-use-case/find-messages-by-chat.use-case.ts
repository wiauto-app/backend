import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { PaginationFilter } from "@/src/contexts/shared/domain/filters/pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";

import { ChatMessage } from "../../../domain/entities/chatMessage";
import { ChatMessageRepository } from "../../../domain/repositories/chat-message.repository";
import { FindMessagesByChatDto } from "./find-messages-by-chat.dto";

@Injectable()
export class FindMessagesByChatUseCase {
  constructor(private readonly chat_message_repository: ChatMessageRepository) {}

  async execute(
    find_messages_by_chat_dto: FindMessagesByChatDto,
  ): Promise<PaginatedResult<ChatMessage>> {
    const pagination_filter = new PaginationFilter(
      find_messages_by_chat_dto.page,
      find_messages_by_chat_dto.limit,
      find_messages_by_chat_dto.order_direction ?? "ASC",
      find_messages_by_chat_dto.query,
      find_messages_by_chat_dto.order_by,
      find_messages_by_chat_dto.search,
    );

    return this.chat_message_repository.findByChatId(
      find_messages_by_chat_dto.chat_id,
      pagination_filter,
    );
  }
}
