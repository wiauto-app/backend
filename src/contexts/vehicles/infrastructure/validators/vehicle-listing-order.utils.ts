import type { SelectQueryBuilder } from "typeorm";

import type { VehicleEntity } from "../persistence/vehicle.entity";

export const apply_vehicle_created_at_listing_order = (
  qb: SelectQueryBuilder<VehicleEntity>,
  direction: "ASC" | "DESC",
  featured_sort_now: Date,
): void => {
  qb
    .addSelect(
      `CASE WHEN vehicle.is_featured = true AND (vehicle.featured_expires_at IS NULL OR vehicle.featured_expires_at > :featured_sort_now) THEN 1 ELSE 0 END`,
      "vehicle_featured_sort_rank",
    )
    .addSelect(
      "GREATEST(COALESCE(vehicle.renewed_at, vehicle.created_at), vehicle.created_at)",
      "vehicle_effective_sort_at",
    )
    .orderBy("vehicle_featured_sort_rank", "DESC")
    .addOrderBy("vehicle_effective_sort_at", direction)
    .setParameter("featured_sort_now", featured_sort_now);
};
