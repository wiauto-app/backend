import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";

import { VehicleFilter } from "../filters/vehicle.filter";
import { Vehicle } from "../entities/vehicle";
import { VehicleListItem } from "../read-models/vehicle-list-item";

export abstract class VehicleRepository {
  /** Anuncios activos (no eliminados con soft delete) del perfil. */
  abstract count_active_by_profile_id(profile_id: string): Promise<number>;

  abstract save(vehicle: Vehicle): Promise<void>;
  abstract find_all(filter: VehicleFilter): Promise<PaginatedResult<VehicleListItem>>;
  abstract findOne(id: string): Promise<Vehicle | null>;
  abstract update(vehicle: Vehicle): Promise<void>;
  abstract remove(id: string): Promise<void>;
}