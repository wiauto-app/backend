import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { CatalogPaginationFilter } from "@/src/contexts/shared/types/catalog-pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/types/paginated-result.vo";
import { FinalizeImageStoragePathService } from "@/src/contexts/shared/file/services/finalize-image-storage-path.service";
import { PaginationHttpDto } from "@/src/contexts/shared/dto/pagination.http-dto";
import { runPaginatedTypeormFind } from "@/src/contexts/shared/typeorm/run-paginated-typeorm-find";
import { slugify } from "@/src/contexts/shared/slugify-string/slugify";
import { uuidv4 } from "@/src/contexts/shared/uuid-generator/uuid-generator";
import { PrimitiveVehicleType } from "@/src/contexts/vehicles/types/vehicle-types";
import { VehicleTypeNotFoundException } from "@/src/contexts/vehicles/exceptions/vehicle-type-not-found.exception";
import { VehicleTypeEntity } from "@/src/contexts/vehicles/entities/vehicle-type.entity";

const VEHICLE_TYPE_SORT_KEYS = new Set([
  "id",
  "name",
  "slug",
  "created_at",
  "updated_at",
]);

export interface CreateVehicleTypeInput {
  name: string;
  image_url?: string | null;
}

export interface UpdateVehicleTypeInput {
  name?: string;
  image_url?: string | null;
}

@Injectable()
export class VehicleTypesService {
  constructor(
    @InjectRepository(VehicleTypeEntity)
    private readonly vehicle_type_repository: Repository<VehicleTypeEntity>,
    private readonly finalize_image_storage_path_service: FinalizeImageStoragePathService,
  ) {}

  async create(
    input: CreateVehicleTypeInput,
  ): Promise<{ vehicleType: PrimitiveVehicleType }> {
    const name = input.name.trim();
    const image_url = input.image_url
      ? await this.finalize_image_storage_path_service.execute(input.image_url)
      : null;
    const row = this.vehicle_type_repository.create({
      id: uuidv4(),
      name,
      slug: slugify(name),
      image_url,
    });
    const saved = await this.vehicle_type_repository.save(row);
    return { vehicleType: this.toPrimitive(saved) };
  }

  async update(
    id: string,
    input: UpdateVehicleTypeInput,
  ): Promise<{ vehicleType: PrimitiveVehicleType }> {
    const existing = await this.vehicle_type_repository.findOne({
      where: { id },
    });
    if (!existing) {
      throw new VehicleTypeNotFoundException(id);
    }

    const next_name =
      input.name === undefined ? existing.name : input.name.trim();
    let next_image_url = existing.image_url ?? null;
    if (input.image_url !== undefined) {
      next_image_url =
        input.image_url === null
          ? null
          : await this.finalize_image_storage_path_service.execute(
              input.image_url,
            );
    }
    const next_slug =
      input.name === undefined ? existing.slug : slugify(next_name);

    const row = await this.vehicle_type_repository.preload({
      id,
      name: next_name,
      slug: next_slug,
      image_url: next_image_url,
    });
    if (!row) {
      throw new VehicleTypeNotFoundException(id);
    }

    const saved = await this.vehicle_type_repository.save(row);
    return { vehicleType: this.toPrimitive(saved) };
  }

  async findAll(
    query: PaginationHttpDto,
  ): Promise<PaginatedResult<PrimitiveVehicleType>> {
    const filter = new CatalogPaginationFilter({ ...query });
    return runPaginatedTypeormFind({
      repository: this.vehicle_type_repository,
      filter,
      map_row: (row) => this.toPrimitive(row),
      allowed_sort_keys: VEHICLE_TYPE_SORT_KEYS,
      default_sort_key: "created_at",
    });
  }

  async findOne(id: string): Promise<{ vehicleType: PrimitiveVehicleType }> {
    const vehicleType = await this.findById(id);
    if (!vehicleType) {
      throw new VehicleTypeNotFoundException(id);
    }
    return { vehicleType };
  }

  async findById(id: string): Promise<PrimitiveVehicleType | null> {
    const row = await this.vehicle_type_repository.findOne({ where: { id } });
    if (!row) {
      return null;
    }
    return this.toPrimitive(row);
  }

  async remove(id: string): Promise<void> {
    await this.vehicle_type_repository.delete(id);
  }

  private toPrimitive(row: VehicleTypeEntity): PrimitiveVehicleType {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      image_url: row.image_url,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}
