import { ChatMessageType } from "../../../domain/entities/chatMessage";
import { ChatMessageMetadata } from "../../../domain/entities/chatMessageMetadata";

export class CreateChatMessageDto {
  chat_id: string;
  sender_id: string;
  content: string;
  type: ChatMessageType;
  metadata?: ChatMessageMetadata | null;
}
