import { IsOptional, IsUUID } from "class-validator";

export class MarkChatMessagesReadHttpDto {
  @IsOptional()
  @IsUUID()
  last_message_id?: string;
}
