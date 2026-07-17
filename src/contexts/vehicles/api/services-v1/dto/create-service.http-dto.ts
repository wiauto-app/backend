import { IsNotEmpty, IsString } from "class-validator";

export class CreateServiceHttpDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;
}
