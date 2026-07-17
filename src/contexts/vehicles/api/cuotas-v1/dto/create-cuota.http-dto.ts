import { IsInt, IsNotEmpty, IsString, MinLength } from "class-validator";

export class CreateCuotaHttpDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  name: string;

  @IsInt()
  value: number;
}
