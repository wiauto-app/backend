import {
  ChatMessageStatus,
  ChatMessageType,
} from "../types/chatMessage";
import { ChatMessageMetadata } from "../types/chatMessageMetadata";

export interface UpdateChatMessageDto {
  id: string;
  content?: string;
  type?: ChatMessageType;
  status?: ChatMessageStatus;
  metadata?: ChatMessageMetadata | null;
}
