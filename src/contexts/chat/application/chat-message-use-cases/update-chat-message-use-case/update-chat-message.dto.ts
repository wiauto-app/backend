import {
  ChatMessageStatus,
  ChatMessageType,
} from "../../../domain/entities/chatMessage";
import { ChatMessageMetadata } from "../../../domain/entities/chatMessageMetadata";

export class UpdateChatMessageDto {
  id: string;
  content?: string;
  type?: ChatMessageType;
  status?: ChatMessageStatus;
  metadata?: ChatMessageMetadata | null;
}
