import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";

import { VehicleFilter } from "../filters/vehicle.filter";
import { OwnerVehicleFilter } from "../filters/owner-vehicle.filter";
import { Vehicle } from "../entities/vehicle";
import { VehicleListItem, AdminVehicleListItem } from "../read-models/vehicle-list-item";
import { OwnerVehicleListItem } from "../read-models/owner-vehicle-list-item";
import { AdminVehicleDetail } from "../read-models/admin-vehicle-detail";
import { VehicleDetail } from "../read-models/vehicle-detail";
import { AdminVehicleFilter } from "../filters/admin-vehicle.filter";

export abstract class VehicleRepository {
  /** Anuncios activos (no eliminados con soft delete) del perfil. */
  abstract count_active_by_profile_id(profile_id: string): Promise<number>;

  abstract save(vehicle: Vehicle): Promise<void>;
  abstract findAll(filter:  VehicleFilter): Promise<PaginatedResult<VehicleListItem>>;
  abstract findOne(id: string): Promise<VehicleDetail | null>;
  abstract findById(id: string): Promise<Vehicle | null>;
  abstract findAllByProfileId(
    filter: OwnerVehicleFilter,
  ): Promise<PaginatedResult<OwnerVehicleListItem>>;
  abstract profileHasApprovedAdsBefore(
    profile_id: string,
    exclude_vehicle_id?: string,
  ): Promise<boolean>;
  abstract findScheduledForPublish(now: Date): Promise<Vehicle[]>;
  abstract duplicate(source_vehicle_id: string): Promise<string>;
  abstract update(vehicle: Vehicle): Promise<void>;
  abstract remove(id: string): Promise<void>;

  abstract adminFindAll(filter: AdminVehicleFilter): Promise<PaginatedResult<AdminVehicleListItem>>;
  abstract adminFindOne(id: string): Promise<AdminVehicleDetail | null>;
}