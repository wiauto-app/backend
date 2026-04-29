import { IsNotEmpty, IsUUID } from "class-validator";


export class RemoveFeatureHttpDto {
  @IsNotEmpty()
  @IsUUID("4")
  id: string;
}