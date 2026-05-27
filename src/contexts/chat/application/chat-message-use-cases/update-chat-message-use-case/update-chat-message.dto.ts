import {
  ChatMessageStatus,
  ChatMessageType,
} from "../../../domain/entities/chatMessage";

export class UpdateChatMessageDto {
  id: string;
  content?: string;
  type?: ChatMessageType;
  status?: ChatMessageStatus;
}
