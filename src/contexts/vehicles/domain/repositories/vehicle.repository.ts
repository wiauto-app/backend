import { PaginationDto } from "@/src/contexts/shared/dto/pagination.dto";
import { Vehicle } from "../entities/vehicle";
import { VehicleListItem } from "../read-models/vehicle-list-item";

export abstract class VehicleRepository {
  abstract save(vehicle: Vehicle): Promise<void>;
  abstract findAll(pagination: PaginationDto): Promise<{
    vehicles: VehicleListItem[];
    total_count: number;
  }>;
  abstract findOne(id: string): Promise<Vehicle | null>;
  abstract update(vehicle: Vehicle): Promise<void>;
}