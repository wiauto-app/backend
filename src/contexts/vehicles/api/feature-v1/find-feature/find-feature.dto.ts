import { IsNotEmpty, IsUUID } from "class-validator";


export class FindFeatureHttpDto {
  @IsNotEmpty()
  @IsUUID("4")
  id: string; 
}