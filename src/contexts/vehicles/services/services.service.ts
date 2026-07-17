import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { CatalogPaginationFilter } from "@/src/contexts/shared/types/catalog-pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/types/paginated-result.vo";
import { PaginationHttpDto } from "@/src/contexts/shared/dto/pagination.http-dto";
import { runPaginatedTypeormFind } from "@/src/contexts/shared/typeorm/run-paginated-typeorm-find";
import { slugify } from "@/src/contexts/shared/slugify-string/slugify";
import { uuidv4 } from "@/src/contexts/shared/uuid-generator/uuid-generator";
import { PrimitiveService } from "@/src/contexts/vehicles/types/services";
import { ServiceNotFoundException } from "@/src/contexts/vehicles/exceptions/service-not-found.exception";
import { ServiceEntity } from "@/src/contexts/vehicles/entities/service.entity";

const SERVICE_SORT_KEYS = new Set([
  "id",
  "name",
  "description",
  "slug",
  "created_at",
  "updated_at",
]);

export interface CreateServiceInput {
  name: string;
  description: string;
}

export interface UpdateServiceInput {
  name?: string;
  description?: string;
}

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(ServiceEntity)
    private readonly service_repository: Repository<ServiceEntity>,
  ) {}

  async create(
    input: CreateServiceInput,
  ): Promise<{ service: PrimitiveService }> {
    const name = input.name.trim();
    const row = this.service_repository.create({
      id: uuidv4(),
      name,
      description: input.description,
      slug: slugify(name),
    });
    const saved = await this.service_repository.save(row);
    return { service: this.toPrimitive(saved) };
  }

  async update(
    id: string,
    input: UpdateServiceInput,
  ): Promise<{ service: PrimitiveService }> {
    const existing = await this.service_repository.findOne({ where: { id } });
    if (!existing) {
      throw new ServiceNotFoundException(id);
    }

    const next_name =
      input.name === undefined ? existing.name : input.name.trim();
    const next_description =
      input.description === undefined ? existing.description : input.description;
    const next_slug =
      input.name === undefined ? existing.slug : slugify(next_name);

    const row = await this.service_repository.preload({
      id,
      name: next_name,
      description: next_description,
      slug: next_slug,
    });
    if (!row) {
      throw new ServiceNotFoundException(id);
    }

    const saved = await this.service_repository.save(row);
    return { service: this.toPrimitive(saved) };
  }

  async findAll(
    query: PaginationHttpDto,
  ): Promise<PaginatedResult<PrimitiveService>> {
    const filter = new CatalogPaginationFilter({ ...query });
    return runPaginatedTypeormFind({
      repository: this.service_repository,
      filter,
      map_row: (row) => this.toPrimitive(row),
      allowed_sort_keys: SERVICE_SORT_KEYS,
      default_sort_key: "created_at",
    });
  }

  async findOne(id: string): Promise<{ service: PrimitiveService }> {
    const service = await this.findById(id);
    if (!service) {
      throw new ServiceNotFoundException(id);
    }
    return { service };
  }

  async findById(id: string): Promise<PrimitiveService | null> {
    const row = await this.service_repository.findOne({ where: { id } });
    if (!row) {
      return null;
    }
    return this.toPrimitive(row);
  }

  async remove(id: string): Promise<void> {
    await this.service_repository.delete(id);
  }

  private toPrimitive(row: ServiceEntity): PrimitiveService {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      slug: row.slug,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}
