import { z } from "zod";
import { VehicleService } from "@/src/contexts/vehicles/services/vehicle.service";

export const assistantVehicleTargetSchema = z
  .object({
    vehicle_ref: z.number().int().positive().optional(),
    vehicle_id: z.string().uuid().optional(),
  })
  .refine(
    (data) => data.vehicle_ref != null || Boolean(data.vehicle_id),
    { message: "Se requiere vehicle_ref o vehicle_id" },
  );

export const assistantVehicleTargetsSchema = z
  .object({
    vehicle_refs: z.array(z.number().int().positive()).min(2).max(4).optional(),
    vehicle_ids: z.array(z.string().uuid()).min(2).max(4).optional(),
  })
  .refine(
    (data) =>
      (data.vehicle_refs?.length ?? 0) >= 2 ||
      (data.vehicle_ids?.length ?? 0) >= 2,
    { message: "Se requieren vehicle_refs o vehicle_ids (mínimo 2)" },
  );

export interface ResolveAssistantVehicleIdInput {
  vehicle_ref?: number;
  vehicle_id?: string;
}

export interface ResolveAssistantVehicleIdsInput {
  vehicle_refs?: number[];
  vehicle_ids?: string[];
}

interface ResolveAssistantVehicleOptions {
  vehicleService: VehicleService;
}

/** Prefiere vehicle_ref; UUID solo como fallback interno/legacy. */
export const resolveAssistantVehicleId = async (
  input: ResolveAssistantVehicleIdInput,
  { vehicleService }: ResolveAssistantVehicleOptions,
): Promise<string> => {
  if (input.vehicle_ref != null) {
    const { id } = await vehicleService.findActiveIdByRef(input.vehicle_ref);
    return id;
  }

  if (input.vehicle_id) {
    return input.vehicle_id;
  }

  throw new Error("Se requiere vehicle_ref o vehicle_id");
};

/** Prefiere vehicle_refs; vehicle_ids solo como fallback legacy. */
export const resolveAssistantVehicleIds = async (
  input: ResolveAssistantVehicleIdsInput,
  { vehicleService }: ResolveAssistantVehicleOptions,
): Promise<string[]> => {
  if (input.vehicle_refs && input.vehicle_refs.length >= 2) {
    const uniqueRefs = [...new Set(input.vehicle_refs)];
    return Promise.all(
      uniqueRefs.map(async (ref) => {
        const { id } = await vehicleService.findActiveIdByRef(ref);
        return id;
      }),
    );
  }

  if (input.vehicle_ids && input.vehicle_ids.length >= 2) {
    return [...new Set(input.vehicle_ids)];
  }

  throw new Error("Se requieren vehicle_refs o vehicle_ids");
};
