import { ChatType } from "../../../domain/entities/chat";

export class CreateChatDto {
  participants: string[];
  chat_type: ChatType;
  vehicle_id: string;
}
