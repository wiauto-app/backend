import { Type } from "class-transformer";
import { IsInt, IsOptional, Max, Min } from "class-validator";

export const VEHICLE_SITEMAP_PAGE_SIZE = 5000;

export class VehicleSitemapHttpDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(VEHICLE_SITEMAP_PAGE_SIZE)
  limit = VEHICLE_SITEMAP_PAGE_SIZE;
}
