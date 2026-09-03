import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, Max, Min } from "class-validator";

import type { VehicleListingSitemapVariant } from "@/src/contexts/vehicles/types/vehicle-listing-sitemap";

export const VEHICLE_SITEMAP_LISTING_PAGE_SIZE = 5000;

export const SITEMAP_VEHICLE_LISTING_VARIANTS = [
  "catalog",
  "with-province",
] as const satisfies readonly VehicleListingSitemapVariant[];

export class VehicleSitemapListHttpDto {
  @IsIn(SITEMAP_VEHICLE_LISTING_VARIANTS)
  variant: VehicleListingSitemapVariant;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(VEHICLE_SITEMAP_LISTING_PAGE_SIZE)
  limit = VEHICLE_SITEMAP_LISTING_PAGE_SIZE;
}

export class VehicleSitemapListMetaHttpDto {
  @IsIn(SITEMAP_VEHICLE_LISTING_VARIANTS)
  variant: VehicleListingSitemapVariant;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(VEHICLE_SITEMAP_LISTING_PAGE_SIZE)
  limit = VEHICLE_SITEMAP_LISTING_PAGE_SIZE;
}
