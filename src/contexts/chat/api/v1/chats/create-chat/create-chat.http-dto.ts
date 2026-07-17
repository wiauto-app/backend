import { IsArray, IsEnum, IsOptional, IsUUID } from "class-validator";

import { CHAT_TYPE, ChatType } from "@/src/contexts/chat/types/chat";

export class CreateChatHttpDto {
  @IsArray()
  @IsUUID("4", { each: true })
  participants: string[];

  @IsEnum(CHAT_TYPE)
  chat_type: ChatType;

  @IsOptional()
  @IsUUID("4")
  vehicle_id: string | null;
}

