export interface CompareVehicleSummary {
  id: string;
  ref: string | null;
  title: string;
  price: number;
  mileage: number;
  year: number | null;
  make: string | null;
  model: string | null;
  fuel: string | null;
  transmission: string | null;
  power: number | null;
  publisher_type: string;
  warranty: string | null;
  dgt_label: string | null;
  condition: string;
  location: string | null;
  key_features: string | null;
  autonomy: number | null;
  battery_capacity: number | null;
}

export interface CompareVehiclesCriterion {
  key: string;
  label: string;
  values: Record<string, string | number | null>;
}

export interface CompareVehiclesResult {
  vehicles: CompareVehicleSummary[];
  criteria: CompareVehiclesCriterion[];
  highlights: string[];
}
