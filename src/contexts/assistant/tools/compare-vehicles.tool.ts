import { tool } from "ai";
import { VehicleService } from "@/src/contexts/vehicles/services/vehicle.service";
import {
  buildAssistantVehicleSummary,
  type AssistantVehicleSummary,
} from "../helpers/build-assistant-vehicle-summary";
import {
  assistantVehicleTargetsSchema,
  resolveAssistantVehicleIds,
} from "../helpers/resolve-assistant-vehicle-id";
import type {
  CompareVehiclesCriterion,
  CompareVehiclesResult,
} from "../types/compare-vehicles";

interface CreateCompareVehiclesToolOptions {
  vehicleService: VehicleService;
}

interface CriterionDefinition {
  key: keyof AssistantVehicleSummary;
  label: string;
  /** Si true, solo se incluye la fila cuando algún vehículo tiene valor. */
  onlyIfPresent?: boolean;
}

const CRITERIA_DEFINITIONS: CriterionDefinition[] = [
  { key: "price", label: "Precio" },
  { key: "mileage", label: "Kilometraje" },
  { key: "year", label: "Año" },
  { key: "power", label: "Potencia (CV)" },
  { key: "fuel", label: "Combustible" },
  { key: "transmission", label: "Transmisión" },
  { key: "warranty", label: "Garantía" },
  { key: "dgt_label", label: "Etiqueta DGT" },
  { key: "condition", label: "Estado" },
  { key: "publisher_type", label: "Tipo de vendedor" },
  { key: "location", label: "Ubicación" },
  { key: "key_features", label: "Características principales" },
  { key: "autonomy", label: "Autonomía (km)", onlyIfPresent: true },
  { key: "battery_capacity", label: "Batería (kWh)", onlyIfPresent: true },
];

const hasCriterionValue = (value: string | number | null | undefined): boolean => {
  if (value === null || value === undefined) {
    return false;
  }
  if (typeof value === "string") {
    return value.trim().length > 0;
  }
  return true;
};

export const createCompareVehiclesTool = ({
  vehicleService,
}: CreateCompareVehiclesToolOptions) =>
  tool({
    description:
      "Compara de 2 a 4 vehículos concretos por sus referencias numéricas (vehicle_refs preferido) o UUIDs internos (vehicle_ids legacy): precio, km, año, potencia, combustible, transmisión, garantía, DGT, ubicación, etc. OBLIGATORIA cuando el usuario pide comparar y lista Ref. N. NUNCA uses searchVehicles en su lugar.",
    inputSchema: assistantVehicleTargetsSchema,
    execute: async (input): Promise<CompareVehiclesResult> => {
      const uniqueIds = await resolveAssistantVehicleIds(input, {
        vehicleService,
      });
      const vehicles = await Promise.all(
        uniqueIds.map(async (id) => {
          const detail = await vehicleService.findOne({ id });
          return buildAssistantVehicleSummary(detail);
        }),
      );

      const criteria: CompareVehiclesCriterion[] = CRITERIA_DEFINITIONS.filter(
        ({ key, onlyIfPresent }) => {
          if (!onlyIfPresent) {
            return true;
          }
          return vehicles.some((vehicle) =>
            hasCriterionValue(vehicle[key] as string | number | null),
          );
        },
      ).map(({ key, label }) => ({
        key,
        label,
        values: Object.fromEntries(
          vehicles.map((vehicle) => [
            vehicle.id,
            (vehicle[key] as string | number | null) ?? null,
          ]),
        ),
      }));

      const prices = vehicles.map((vehicle) => vehicle.price);
      const cheapest = vehicles.reduce((best, current) =>
        current.price < best.price ? current : best,
      );
      const lowestMileage = vehicles.reduce((best, current) =>
        current.mileage < best.mileage ? current : best,
      );

      const highlights = [
        `Más económico: ${cheapest.title} (Ref. ${cheapest.ref}, ${cheapest.price} €)`,
        `Menor kilometraje: ${lowestMileage.title} (Ref. ${lowestMileage.ref}, ${lowestMileage.mileage} km)`,
        `Rango de precios: ${Math.min(...prices)} – ${Math.max(...prices)} €`,
      ];

      return {
        vehicles: vehicles.map((vehicle) => ({
          id: vehicle.id,
          ref: vehicle.ref,
          title: vehicle.title,
          price: vehicle.price,
          mileage: vehicle.mileage,
          year: vehicle.year,
          make: vehicle.make,
          model: vehicle.model,
          fuel: vehicle.fuel,
          transmission: vehicle.transmission,
          power: vehicle.power,
          publisher_type: vehicle.publisher_type,
          warranty: vehicle.warranty,
          dgt_label: vehicle.dgt_label,
          condition: vehicle.condition,
          location: vehicle.location,
          key_features: vehicle.key_features,
          autonomy: vehicle.autonomy,
          battery_capacity: vehicle.battery_capacity,
        })),
        criteria,
        highlights,
      };
    },
  });
