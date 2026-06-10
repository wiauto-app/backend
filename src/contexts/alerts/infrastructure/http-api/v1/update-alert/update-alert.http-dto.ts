import { IsNotEmpty, IsOptional, IsString } from "class-validator";

import { AlertFiltersHttpDto } from "../alert-filters.http-dto";

export class UpdateAlertHttpDto extends AlertFiltersHttpDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;
}
