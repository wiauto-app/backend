import { ChatMessageType } from "../types/chatMessage";
import { ChatMessageMetadata } from "../types/chatMessageMetadata";

export interface CreateChatMessageDto {
  chat_id: string;
  sender_id: string;
  content: string;
  type: ChatMessageType;
  metadata?: ChatMessageMetadata | null;
}
