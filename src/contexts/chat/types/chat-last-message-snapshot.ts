import { ChatMessage } from "../types/chatMessage";

export interface ChatLastMessageSnapshot {
  chat_id: string;
  content: string;
  type: ChatMessage["type"];
  created_at: Date;
}
