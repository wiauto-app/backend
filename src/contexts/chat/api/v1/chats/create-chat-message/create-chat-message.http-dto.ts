import { Type } from "class-transformer";
import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested,
} from "class-validator";

import {
  CHAT_MESSAGE_TYPE,
  ChatMessageType,
} from "@/src/contexts/chat/types/chatMessage";
import { ChatMessageMetadata } from "@/src/contexts/chat/types/chatMessageMetadata";

class ChatMessageMetadataHttpDto implements ChatMessageMetadata {
  @IsOptional()
  @IsString()
  file_name?: string;

  @IsOptional()
  @IsString()
  mime_type?: string;

  @IsOptional()
  file_size_bytes?: number;

  @IsOptional()
  duration_seconds?: number;

  @IsOptional()
  @IsString()
  caption?: string;

  @IsOptional()
  width?: number;

  @IsOptional()
  height?: number;
}

export class CreateChatMessageHttpDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsEnum(CHAT_MESSAGE_TYPE)
  type: ChatMessageType;

  @IsOptional()
  @ValidateIf((dto: CreateChatMessageHttpDto) => dto.type !== CHAT_MESSAGE_TYPE.TEXT)
  @IsObject()
  @ValidateNested()
  @Type(() => ChatMessageMetadataHttpDto)
  metadata?: ChatMessageMetadataHttpDto;
}
