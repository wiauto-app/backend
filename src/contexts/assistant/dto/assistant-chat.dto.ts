import { IsArray } from "class-validator";
import type { UIMessage } from "ai";

export class AssistantChatDto {
  @IsArray()
  messages: UIMessage[];
}
