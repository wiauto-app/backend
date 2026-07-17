import { PaginationFilter } from "@/src/contexts/shared/types/pagination.filter";

import {
  ConditionVehicle,
  PublisherType,
  StatusVehicle,
  TransmissionType,
} from "./vehicle";
import { PaginationDto } from "@/src/contexts/shared/dto/pagination.dto";

/** Filtros de catálogo / listado de anuncios (dominio), sin dependencias de aplicación ni HTTP. */
export interface VehicleFilterOptions extends PaginationDto {
  
  type_slug?: string;
  makes_slugs?: string[];
  models_slugs?: string[];
  categories_slugs?: string[];
  since_price?: number;
  until_price?: number;
  price_offer?: boolean;
  service_slugs?: string[];
  provinces_slugs?: string[];
  comunities_slugs?: string[];
  municipalities_slugs?: string[];
  lat?: number;
  lng?: number;
  radius?: number;
  publisher_types?: PublisherType[];
  is_seller_featured?: boolean;
  warranty_slugs?: string[];
  since_year?: number;
  until_year?: number;
  since_mileage?: number;
  until_mileage?: number;
  transmission_types?: TransmissionType[];
  fuel_type_slugs?: string[];
  traction_slugs?: string[];
  power_since?: number;
  power_until?: number;
  displacement_since?: number;
  displacement_until?: number;
  dgt_label_ids?: string[];
  autonomy_since?: number;
  battery_capacity_since?: number;
  battery_capacity_until?: number;
  time_to_charge?: number;
  features_slugs?: string[];
  color_slugs?: string[];
  cuota_slugs?: string[];
  condition?: ConditionVehicle;
  status?: StatusVehicle;
  exclude_vehicle_ids?: string[];
  dealership_ids?: string[];
}

export class VehicleFilter extends PaginationFilter implements Omit<VehicleFilterOptions, "page" | "limit" | "query" | "order_by" | "order_direction"> {
  type_slug?: string;
  makes_slugs?: string[];
  models_slugs?: string[];
  categories_slugs?: string[];
  since_price?: number;
  until_price?: number;
  price_offer?: boolean;
  service_slugs?: string[];
  provinces_slugs?: string[];
  comunities_slugs?: string[];
  municipalities_slugs?: string[];
  lat?: number;
  lng?: number;
  radius?: number;
  publisher_types?: PublisherType[];
  is_seller_featured?: boolean;
  warranty_slugs?: string[];
  since_year?: number;
  until_year?: number;
  since_mileage?: number;
  until_mileage?: number;
  transmission_types?: TransmissionType[];
  fuel_type_slugs?: string[];
  traction_slugs?: string[];
  power_since?: number;
  power_until?: number;
  displacement_since?: number;
  displacement_until?: number;
  dgt_label_ids?: string[];
  autonomy_since?: number;
  battery_capacity_since?: number;
  battery_capacity_until?: number;
  time_to_charge?: number;
  features_slugs?: string[];
  color_slugs?: string[];
  cuota_slugs?: string[];
  condition?: ConditionVehicle;
  status?: StatusVehicle;
  exclude_vehicle_ids?: string[];
  dealership_ids?: string[];

  constructor(options: VehicleFilterOptions) {
    const {
      page,
      limit,
      order_direction,
      query,
      order_by,
      ...catalog
    } = options;
    super(page ?? 1, limit ?? 10, order_direction, query, order_by);
    Object.assign(this, catalog);
  }
}
