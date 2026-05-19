import { IsUUID } from "class-validator";


export class DeleteSuspensionDurationTypeDto {
  @IsUUID("4")
  id: string;
}