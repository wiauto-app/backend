import { CatalogPaginationFilter } from "@/src/contexts/shared/domain/filters/catalog-pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";
import { run_paginated_typeorm_find } from "@/src/contexts/shared/infrastructure/typeorm/run-paginated-typeorm-find";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { VehicleType } from "../../domain/entities/vehicle-types";
import { VehicleTypesRepository } from "../../domain/repositories/vehicle-types.repository";
import { VehicleTypeEntity } from "../persistence/vehicle-type.entity";

const VEHICLE_TYPE_SORT_KEYS = new Set([
  "id",
  "name",
  "slug",
  "created_at",
  "updated_at",
]);


export class TypeormVehicleTypeRepository extends VehicleTypesRepository {
  constructor(
    @InjectRepository(VehicleTypeEntity)
    private readonly vehicleTypeRepository: Repository<VehicleTypeEntity>,
  ){
    super();
  }

  async find_all(filter: CatalogPaginationFilter): Promise<PaginatedResult<VehicleType>> {
    return run_paginated_typeorm_find({
      repository: this.vehicleTypeRepository,
      filter,
      map_row: (row) => VehicleType.fromPrimitives(row),
      allowed_sort_keys: VEHICLE_TYPE_SORT_KEYS,
      default_sort_key: "created_at",
    });
  }

  async findOne(id: string): Promise<VehicleType | null> {
    const vehicleType = await this.vehicleTypeRepository.findOne({ where: { id } });
    if (!vehicleType) {
      return null;
    }
    return VehicleType.fromPrimitives(vehicleType);
  }

  async save(vehicleType: VehicleType): Promise<void> {
    await this.vehicleTypeRepository.save(vehicleType.toPrimitives());
  }

  async update(id: string, name: string): Promise<void> {
    await this.vehicleTypeRepository.update(id, { name });
  }

  async remove(id: string): Promise<void> {
    await this.vehicleTypeRepository.delete(id);
  }
}