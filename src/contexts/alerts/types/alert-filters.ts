import type { VehicleFilterOptions } from "@/src/contexts/vehicles/types/vehicle.filter";

export type AlertFilters = Partial<
  Omit<
    VehicleFilterOptions,
    | "page"
    | "limit"
    | "query"
    | "order_by"
    | "order_direction"
    | "status"
    | "exclude_vehicle_ids"
  >
> & {
  source_vehicle_id?: string;
};
