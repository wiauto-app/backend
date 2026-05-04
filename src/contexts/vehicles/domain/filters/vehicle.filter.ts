import { PaginationFilter } from "@/src/contexts/shared/domain/filters/pagination.filter";

import { PublisherType, TransmissionType } from "../entities/vehicle";

/** Filtros de catálogo / listado de anuncios (dominio), sin dependencias de aplicación ni HTTP. */
export interface VehicleFilterOptions {
  page?: number;
  limit?: number;
  query?: string;
  order_by?: string;
  order_direction?: "asc" | "desc";

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

  constructor(options: VehicleFilterOptions = {}) {
    const {
      page = 1,
      limit = 10,
      query,
      order_by,
      order_direction,
      ...catalog
    } = options;
    super(page, limit, query, order_by, order_direction);
    Object.assign(this, catalog);
  }
}
