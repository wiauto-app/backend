import { IsInt, IsNotEmpty, Max, Min } from "class-validator";

export class CreateCatalogYearHttpDto {
  @IsInt()
  @Min(1900)
  @Max(2100)
  @IsNotEmpty()
  year: number;
}
