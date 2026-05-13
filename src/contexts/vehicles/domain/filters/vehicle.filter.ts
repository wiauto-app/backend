import { PaginationFilter } from "@/src/contexts/shared/domain/filters/pagination.filter";

import { PublisherType, TransmissionType } from "../entities/vehicle";
import { PaginationDto } from "@/src/contexts/shared/application/dtos/pagination.dto";

/** Filtros de catálogo / listado de anuncios (dominio), sin dependencias de aplicación ni HTTP. */
export interface VehicleFilterOptions extends PaginationDto {
  
  type_slug?: string;
  make_slug?: string;
  model_slug?: string;
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
}

export class VehicleFilter extends PaginationFilter implements Omit<VehicleFilterOptions, "page" | "limit" | "query" | "order_by" | "order_direction"> {
  type_slug?: string;
  make_slug?: string;
  model_slug?: string;
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

  constructor(options: VehicleFilterOptions) {
    const {
      page,
      limit,
      order_direction,
      query,
      order_by,
      ...catalog
    } = options;
    super(page, limit, order_direction, query, order_by);
    Object.assign(this, catalog);
  }
}
