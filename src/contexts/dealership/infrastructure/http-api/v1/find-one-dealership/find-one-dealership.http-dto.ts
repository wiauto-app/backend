import { IsNotEmpty, IsUUID } from "class-validator";

export class FindDealershipHttpDto {
  @IsNotEmpty()
  @IsUUID("4")
  id: string;
}
