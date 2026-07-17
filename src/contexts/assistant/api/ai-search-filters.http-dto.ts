import { IsString, MaxLength, MinLength } from "class-validator";

export class AiSearchFiltersHttpDto {
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  message!: string;
}
