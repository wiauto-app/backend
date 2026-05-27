import { IsEnum, IsOptional, IsString } from "class-validator";

import {
  CHAT_MESSAGE_STATUS,
  CHAT_MESSAGE_TYPE,
  ChatMessageStatus,
  ChatMessageType,
} from "@/src/contexts/chat/domain/entities/chatMessage";

export class UpdateChatMessageHttpDto {
  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsEnum(CHAT_MESSAGE_TYPE)
  type?: ChatMessageType;

  @IsOptional()
  @IsEnum(CHAT_MESSAGE_STATUS)
  status?: ChatMessageStatus;
}

