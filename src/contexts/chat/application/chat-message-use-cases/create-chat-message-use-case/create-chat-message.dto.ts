import { ChatMessageType } from "../../../domain/entities/chatMessage";

export class CreateChatMessageDto {
  chat_id: string;
  sender_id: string;
  content: string;
  type: ChatMessageType;
}
