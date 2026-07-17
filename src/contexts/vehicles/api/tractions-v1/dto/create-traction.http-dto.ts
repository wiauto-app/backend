import { IsNotEmpty, IsString } from "class-validator";

export class CreateTractionHttpDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
