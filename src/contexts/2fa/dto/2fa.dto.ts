import { IsNotEmpty, Matches, Length } from "class-validator";

export class TwofaDto {
  @IsNotEmpty()
  @Length(6, 6)
  @Matches(/^\d+$/, { message: 'El código debe contener solo números' })
  code: string;
}