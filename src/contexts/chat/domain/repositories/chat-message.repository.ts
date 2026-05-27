import { PaginationFilter } from "@/src/contexts/shared/domain/filters/pagination.filter";
import { ChatMessage } from "../entities/chatMessage";
import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";


export abstract class ChatMessageRepository {
  abstract save(chatMessage: ChatMessage): Promise<void>;
  abstract findOne(id: string): Promise<ChatMessage | null>;
  abstract findByChatId(chat_id: string,pagination: PaginationFilter): Promise<PaginatedResult<ChatMessage>>;
  abstract delete(id: string): Promise<void>;
}