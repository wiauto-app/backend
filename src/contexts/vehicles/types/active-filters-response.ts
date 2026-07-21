import {
  ConditionVehicle,
  PublisherType,
  TransmissionType,
} from "./vehicle";
import { ActiveFilterItem } from "./active-filter-item";

export interface ActiveFiltersApplied {
  since_price?: number;
  until_price?: number;
  price_offer?: boolean;
  lat?: number;
  lng?: number;
  radius?: number;
  publisher_types?: PublisherType[];
  is_seller_featured?: boolean;
  since_year?: number;
  until_year?: number;
  since_mileage?: number;
  until_mileage?: number;
  transmission_types?: TransmissionType[];
  power_since?: number;
  power_until?: number;
  displacement_since?: number;
  displacement_until?: number;
  autonomy_since?: number;
  battery_capacity_since?: number;
  battery_capacity_until?: number;
  time_to_charge?: number;
  condition?: ConditionVehicle;
}

export interface ActiveFiltersResolved {
  vehicle_type: ActiveFilterItem | null;
  makes: ActiveFilterItem[];
  models: ActiveFilterItem[];
  categories: ActiveFilterItem[];
  provinces: ActiveFilterItem[];
  communities: ActiveFilterItem[];
  municipalities: ActiveFilterItem[];
  services: ActiveFilterItem[];
  warranties: ActiveFilterItem[];
  colors: ActiveFilterItem[];
  dgt_labels: ActiveFilterItem[];
  features: ActiveFilterItem[];
  fuels: ActiveFilterItem[];
  tractions: ActiveFilterItem[];
  cuotas: ActiveFilterItem[];
}

export interface ActiveFiltersResponse {
  resolved: ActiveFiltersResolved;
  applied: ActiveFiltersApplied;
  title: string;
}
