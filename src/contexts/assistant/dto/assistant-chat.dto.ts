import {
  Allow,
  IsArray,
  IsIn,
  IsOptional,
  IsUUID,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { AssistantInitialFiltersHttpDto } from "./assistant-initial-filters.http-dto";
import { ASSISTANT_CHAT_MODES } from "../types/assistant-chat-mode";

class AssistantChatMessagePartDto {
  @Allow()
  type: string;

  @Allow()
  text?: string;

  @Allow()
  state?: string;

  @Allow()
  toolCallId?: string;

  @Allow()
  toolName?: string;

  @Allow()
  input?: unknown;

  @Allow()
  output?: unknown;

  @Allow()
  errorText?: string;
}

class AssistantChatMessageDto {
  @Allow()
  id: string;

  @Allow()
  role: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssistantChatMessagePartDto)
  parts: AssistantChatMessagePartDto[];
}

export class AssistantChatDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssistantChatMessageDto)
  messages: AssistantChatMessageDto[];

  @IsOptional()
  @IsUUID()
  conversation_id?: string;

  @IsOptional()
  @IsIn(ASSISTANT_CHAT_MODES)
  mode?: (typeof ASSISTANT_CHAT_MODES)[number];

  @IsOptional()
  @ValidateNested()
  @Type(() => AssistantInitialFiltersHttpDto)
  initial_filters?: AssistantInitialFiltersHttpDto;
}
