import { IsString, MaxLength, MinLength } from "class-validator";

export class UpdateAssistantConversationDto {
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  title: string;
}
