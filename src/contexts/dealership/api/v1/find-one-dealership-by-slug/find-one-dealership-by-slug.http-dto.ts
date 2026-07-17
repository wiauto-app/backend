import { IsNotEmpty, IsString } from "class-validator";

export class FindDealershipBySlugHttpDto {
  @IsNotEmpty()
  @IsString()
  slug: string;
}
