import { IsUUID } from "class-validator";


export class FindOneSuspensionDurationTypeDto {
  @IsUUID("4")
  id: string;
}