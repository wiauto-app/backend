import { ChatType } from "../types/chat";

export interface CreateChatDto {
  participants: string[];
  chat_type: ChatType;
  vehicle_id: string | null;
}
