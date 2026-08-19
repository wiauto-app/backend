import type { SelectQueryBuilder } from "typeorm";

import type { VehicleEntity } from "../entities/vehicle.entity";

export type PublicListingOrderBy =
  | "created_at"
  | "price"
  | "mileage"
  | "views";

const PUBLIC_LISTING_ORDER_FIELDS = new Set<PublicListingOrderBy>([
  "created_at",
  "price",
  "mileage",
  "views",
]);

export const resolve_public_listing_order_by = (
  order_by?: string,
): PublicListingOrderBy => {
  if (
    order_by &&
    PUBLIC_LISTING_ORDER_FIELDS.has(order_by as PublicListingOrderBy)
  ) {
    return order_by as PublicListingOrderBy;
  }

  return "created_at";
};

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

export const apply_public_listing_order = (
  qb: SelectQueryBuilder<VehicleEntity>,
  order_by: string | undefined,
  order_direction: "ASC" | "DESC" | undefined,
  featured_sort_now: Date = new Date(),
): void => {
  const field = resolve_public_listing_order_by(order_by);
  const direction = order_direction ?? "DESC";

  switch (field) {
    case "price": {
      qb.orderBy("vehicle_prices.price", direction);
      break;
    }
    case "mileage": {
      qb.orderBy("vehicle.mileage", direction);
      break;
    }
    case "views": {
      qb.orderBy("vehicle.views", direction);
      break;
    }
    default: {
      apply_vehicle_created_at_listing_order(qb, direction, featured_sort_now);
      break;
    }
  }
};
