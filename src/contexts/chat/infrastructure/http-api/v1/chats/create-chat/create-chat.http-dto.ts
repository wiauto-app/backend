import { IsArray, IsEnum, IsNotEmpty, IsUUID } from "class-validator";

import { CHAT_TYPE, ChatType } from "@/src/contexts/chat/domain/entities/chat";

export class CreateChatHttpDto {
  @IsArray()
  @IsUUID("4", { each: true })
  participants: string[];

  @IsEnum(CHAT_TYPE)
  chat_type: ChatType;

  @IsUUID("4")
  @IsNotEmpty()
  vehicle_id: string;
}

