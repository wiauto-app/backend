import { CatalogPaginationFilter } from "@/src/contexts/shared/domain/filters/catalog-pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";
import { run_paginated_typeorm_find } from "@/src/contexts/shared/infrastructure/typeorm/run-paginated-typeorm-find";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Service } from "../../domain/entities/services";
import { ServiceNotFoundException } from "../../domain/exceptions/service-not-found.exception";
import { ServicesRepository } from "../../domain/repositories/services.repository";
import { ServiceEntity } from "../persistence/service.entity";

const SERVICE_SORT_KEYS = new Set([
  "id",
  "name",
  "description",
  "slug",
  "created_at",
  "updated_at",
]);

export class TypeormServicesRepository extends ServicesRepository {
  constructor(
    @InjectRepository(ServiceEntity)
    private readonly service_repository: Repository<ServiceEntity>,
  ) {
    super();
  }

  async find_all(filter: CatalogPaginationFilter): Promise<PaginatedResult<Service>> {
    return run_paginated_typeorm_find({
      repository: this.service_repository,
      filter,
      map_row: (row) => Service.fromPrimitives(row),
      allowed_sort_keys: SERVICE_SORT_KEYS,
      default_sort_key: "created_at",
    });
  }

  async findOne(id: string): Promise<Service | null> {
    const row = await this.service_repository.findOne({ where: { id } });
    if (!row) {
      return null;
    }
    return Service.fromPrimitives(row);
  }

  async save(service: Service): Promise<void> {
    await this.service_repository.save(service.toPrimitives());
  }

  async persist_updated(service: Service): Promise<void> {
    const primitive = service.toPrimitives();
    const row = await this.service_repository.preload({
      id: primitive.id,
      name: primitive.name,
      description: primitive.description,
      slug: primitive.slug,
    });
    if (!row) {
      throw new ServiceNotFoundException(primitive.id);
    }
    await this.service_repository.save(row);
  }

  async remove(id: string): Promise<void> {
    await this.service_repository.delete(id);
  }
}
