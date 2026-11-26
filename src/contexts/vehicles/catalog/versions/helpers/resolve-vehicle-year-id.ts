import { InvalidVehicleYearException } from "@/src/contexts/vehicles/exceptions/invalid-vehicle-year.exception";

/** Lo mínimo de la versión que hace falta para resolver el año. */
export interface VehicleYearVersionRef {
  id: number;
  /** Año por defecto de la versión. */
  year_id: number;
}

/** Indica si existe el par en `version_year`. */
export type VersionYearPairChecker = (
  version_id: number,
  year_id: number,
) => Promise<boolean>;

export interface ResolveVehicleYearIdInput {
  version: VehicleYearVersionRef;
  /** Año que manda el cliente (opcional: las apps viejas no lo envían). */
  requested_year_id?: number | null;
  /** Año actual del vehículo (solo al editar). */
  current_year_id?: number | null;
}

/**
 * Resuelve el `year_id` de un vehículo:
 * - con `requested_year_id`: debe existir el par versión–año, si no 400;
 * - sin él, al editar: conserva el año actual si sigue siendo válido;
 * - en otro caso: el año por defecto de la versión.
 */
export const resolveVehicleYearId = async (
  input: ResolveVehicleYearIdInput,
  has_pair: VersionYearPairChecker,
): Promise<number> => {
  const { version, requested_year_id, current_year_id } = input;

  if (requested_year_id != null) {
    if (!(await has_pair(version.id, requested_year_id))) {
      throw new InvalidVehicleYearException();
    }
    return requested_year_id;
  }

  if (current_year_id != null) {
    if (current_year_id === version.year_id) {
      return current_year_id;
    }
    if (await has_pair(version.id, current_year_id)) {
      return current_year_id;
    }
  }

  return version.year_id;
};
