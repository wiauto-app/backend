import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";

import { VehicleFilter } from "../filters/vehicle.filter";
import { Vehicle } from "../entities/vehicle";
import { VehicleListItem, AdminVehicleListItem } from "../read-models/vehicle-list-item";
import { AdminVehicleDetail } from "../read-models/admin-vehicle-detail";
import { AdminVehicleFilter } from "../filters/admin-vehicle.filter";

export abstract class VehicleRepository {
  /** Anuncios activos (no eliminados con soft delete) del perfil. */
  abstract count_active_by_profile_id(profile_id: string): Promise<number>;

  abstract save(vehicle: Vehicle): Promise<void>;
  abstract findAll(filter:  VehicleFilter): Promise<PaginatedResult<VehicleListItem>>;
  abstract findOne(id: string): Promise<Vehicle | null>;
  abstract update(vehicle: Vehicle): Promise<void>;
  abstract remove(id: string): Promise<void>;

  abstract adminFindAll(filter: AdminVehicleFilter): Promise<PaginatedResult<AdminVehicleListItem>>;
  abstract adminFindOne(id: string): Promise<AdminVehicleDetail | null>;
}