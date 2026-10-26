import type {
  ConditionVehicle,
  PublisherType,
  TransmissionType,
} from "../../types/vehicle";

/**
 * Búsqueda normalizada de GET /v1/vehicles guardada en `vehicle_search_history.query`.
 *
 * Las claves son exactamente los query params del listado, para que web y mobile
 * puedan reconstruir la URL. Solo se guardan claves con valor (sin vacíos), arrays
 * deduplicados y ordenados. No incluye paginación (`page`, `limit`), orden
 * (`order_by`, `order_direction`) ni parámetros de contexto (`exclude_vehicle_ids`,
 * `dealership_ids`, `profile_ids`, `search`).
 */
export interface VehicleSearchQuery {
  query?: string;
  type_slug?: string;
  makes_slugs?: string[];
  models_slugs?: string[];
  categories_slugs?: string[];
  since_price?: number;
  until_price?: number;
  price_offer?: boolean;
  provinces_slugs?: string[];
  comunities_slugs?: string[];
  municipalities_slugs?: string[];
  service_slugs?: string[];
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
  dgt_label_slugs?: string[];
  autonomy_since?: number;
  battery_capacity_since?: number;
  battery_capacity_until?: number;
  time_to_charge?: number;
  features_slugs?: string[];
  color_slugs?: string[];
  cuota_slugs?: string[];
  condition?: ConditionVehicle;
}

export type VehicleSearchQueryKey = keyof VehicleSearchQuery;

export interface VehicleSearchHistoryItem {
  id: string;
  query: VehicleSearchQuery;
  label: string;
  filters_count: number;
  results_count: number | null;
  search_count: number;
  last_searched_at: Date;
}
