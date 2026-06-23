import { PartialType } from "@nestjs/mapped-types";
import { Transform } from "class-transformer";
import { IsBoolean, IsOptional } from "class-validator";

import { CreateDealershipHttpDto } from "../create-dealership/create-dealership.http-dto";

export class UpdateDealershipHttpDto extends PartialType(CreateDealershipHttpDto) {
  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  is_featured?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  show_phone?: boolean;
}
