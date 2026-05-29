import { IsOptional, IsString } from "class-validator";

export class UpdateChatMessageHttpDto {
  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}
