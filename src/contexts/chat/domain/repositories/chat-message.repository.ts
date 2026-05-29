import { PaginationFilter } from "@/src/contexts/shared/domain/filters/pagination.filter";
import { ChatMessage } from "../entities/chatMessage";
import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";


export interface ChatLastMessageSnapshot {
  chat_id: string;
  content: string;
  type: ChatMessage["type"];
  created_at: Date;
}

export abstract class ChatMessageRepository {
  abstract save(chatMessage: ChatMessage): Promise<void>;
  abstract findOne(id: string): Promise<ChatMessage | null>;
  abstract findByChatId(chat_id: string, pagination: PaginationFilter): Promise<PaginatedResult<ChatMessage>>;
  abstract delete(id: string): Promise<void>;
  abstract findLatestByChatIds(chat_ids: string[]): Promise<Map<string, ChatLastMessageSnapshot>>;
  abstract markMessagesAsReadForRecipient(
    chat_id: string,
    recipient_id: string,
    last_message_id?: string,
  ): Promise<ChatMessage[]>;
  abstract markMessagesAsDeliveredForRecipient(
    chat_id: string,
    recipient_id: string,
  ): Promise<ChatMessage[]>;
}