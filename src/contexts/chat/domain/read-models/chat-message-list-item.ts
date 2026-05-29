import { ChatMessageMetadata } from "../entities/chatMessageMetadata";
import { ChatMessageStatus, ChatMessageType } from "../entities/chatMessage";

export interface ChatMessageListItem {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  type: ChatMessageType;
  status: ChatMessageStatus;
  metadata: ChatMessageMetadata | null;
  edited_at: Date | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  media_url: string | null;
}
