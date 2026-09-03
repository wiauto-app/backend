import type { VehicleDetail } from "@/src/contexts/vehicles/types/vehicle-detail";

export interface AssistantVehicleSummary {
  id: string;
  ref: string | null;
  title: string;
  price: number;
  mileage: number;
  year: number | null;
  make: string | null;
  model: string | null;
  version: string | null;
  fuel: string | null;
  transmission: string | null;
  power: number | null;
  publisher_type: string;
  warranty: string | null;
  dgt_label: string | null;
  condition: string;
  description: string;
  location: string | null;
  key_features: string | null;
  autonomy: number | null;
  battery_capacity: number | null;
}

const buildLocation = (vehicle: VehicleDetail): string | null => {
  const fromDetails = [
    vehicle.address_details?.municipality,
    vehicle.address_details?.province,
  ]
    .filter(Boolean)
    .join(", ")
    .trim();

  if (fromDetails) {
    return fromDetails;
  }

  const formatted = vehicle.address_details?.formatted_lines
    .filter(Boolean)
    .join(", ")
    .trim();

  if (formatted) {
    return formatted;
  }

  return vehicle.address ?? "";
};

const buildKeyFeatures = (vehicle: VehicleDetail): string | null => {
  const names = (vehicle.features)
    .map((feature) => feature.name)
    .filter(Boolean)
    .slice(0, 5);

  if (names.length === 0) {
    return null;
  }

  return names.join(", ");
};

export const buildAssistantVehicleSummary = (
  vehicle: VehicleDetail,
): AssistantVehicleSummary => {
  const make = vehicle.version.make.name ?? vehicle.version_summary?.make_name;
  const model =
    vehicle.version?.model?.name ?? vehicle.version_summary?.model_name ?? null;
  const versionName =
    vehicle.version?.name ?? vehicle.version_summary?.version_name ?? null;
  const year = vehicle.version?.year?.year ?? null;
  const title = [make, model, year].filter(Boolean).join(" ").trim() || vehicle.id;

  return {
    id: vehicle.id,
    ref: vehicle.ref,
    title,
    price: vehicle.price,
    mileage: vehicle.mileage,
    year,
    make,
    model,
    version: versionName,
    fuel: vehicle.version.fuel_type.name,
    transmission: vehicle.transmission_type,
    power: vehicle.power,
    publisher_type: vehicle.publisher_type,
    warranty: vehicle.warranty_type?.name ?? null,
    dgt_label: vehicle.dgt_label?.name ?? vehicle.dgt_label?.code ?? null,
    condition: vehicle.condition,
    description: vehicle.description,
    location: buildLocation(vehicle),
    key_features: buildKeyFeatures(vehicle),
    autonomy: vehicle.autonomy > 0 ? vehicle.autonomy : null,
    battery_capacity:
      vehicle.battery_capacity > 0 ? vehicle.battery_capacity : null,
  };
};
