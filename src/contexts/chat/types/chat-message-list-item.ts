import { ChatMessageMetadata } from "./chatMessageMetadata";
import { ChatMessageStatus, ChatMessageType } from "./chatMessage";

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
