import { IsNotEmpty, IsString } from "class-validator";

export class CreateMakeHttpDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
