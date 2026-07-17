import { ChatType } from "./chat";
import { ChatMessageType } from "./chatMessage";
import { ChatParticipantSummary } from "./chat-participant-summary";

export interface ChatListItem {
  id: string;
  chat_type: ChatType;
  vehicle_id: string | null;
  created_at: Date;
  updated_at: Date;
  other_participants: ChatParticipantSummary[];
  unread_count: number;
  last_message_preview: string | null;
  last_message_at: Date | null;
  last_message_type: ChatMessageType | null;
}

