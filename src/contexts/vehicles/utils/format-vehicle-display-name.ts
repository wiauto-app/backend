export interface VehicleDisplayNameParts {
  make_name?: string | null;
  model_name?: string | null;
  version_name?: string | null;
}

const DEFAULT_VEHICLE_DISPLAY_NAME = "Vehículo";

export const formatVehicleDisplayName = (
  parts: VehicleDisplayNameParts,
): string => {
  const label = [
    parts.make_name,
    parts.model_name,
    parts.version_name,
  ]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part));

  return label.join(" ") || DEFAULT_VEHICLE_DISPLAY_NAME;
};
