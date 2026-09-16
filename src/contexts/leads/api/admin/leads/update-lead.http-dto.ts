import { IsString, MinLength } from "class-validator";

export class UpdateGenericLeadHttpDto {
  @IsString()
  @MinLength(1)
  status!: string;
}
