import { IsEnum, IsNotEmpty, IsString } from "class-validator";

import { CHAT_MESSAGE_TYPE, ChatMessageType } from "@/src/contexts/chat/domain/entities/chatMessage";

export class CreateChatMessageHttpDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsEnum(CHAT_MESSAGE_TYPE)
  type: ChatMessageType;
}

