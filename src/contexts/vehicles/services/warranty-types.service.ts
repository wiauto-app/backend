import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { CatalogPaginationFilter } from "@/src/contexts/shared/types/catalog-pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/types/paginated-result.vo";
import { PaginationHttpDto } from "@/src/contexts/shared/dto/pagination.http-dto";
import { runPaginatedTypeormFind } from "@/src/contexts/shared/typeorm/run-paginated-typeorm-find";
import { slugify } from "@/src/contexts/shared/slugify-string/slugify";
import { uuidv4 } from "@/src/contexts/shared/uuid-generator/uuid-generator";
import { PrimitiveWarrantyType } from "@/src/contexts/vehicles/types/warranty-type";
import { WarrantyTypeNotFoundException } from "@/src/contexts/vehicles/exceptions/warranty-type-not-found.exception";
import { WarrantyTypeEntity } from "@/src/contexts/vehicles/entities/warranty-type.entity";

const WARRANTY_TYPE_SORT_KEYS = new Set([
  "id",
  "name",
  "description",
  "slug",
  "created_at",
  "updated_at",
]);

export interface CreateWarrantyTypeInput {
  name: string;
  description: string;
}

export interface UpdateWarrantyTypeInput {
  name?: string;
  description?: string;
}

@Injectable()
export class WarrantyTypesService {
  constructor(
    @InjectRepository(WarrantyTypeEntity)
    private readonly warranty_type_repository: Repository<WarrantyTypeEntity>,
  ) {}

  async create(
    input: CreateWarrantyTypeInput,
  ): Promise<{ warranty_type: PrimitiveWarrantyType }> {
    const name = input.name.trim();
    const row = this.warranty_type_repository.create({
      id: uuidv4(),
      name,
      description: input.description,
      slug: slugify(name),
    });
    const saved = await this.warranty_type_repository.save(row);
    return { warranty_type: this.toPrimitive(saved) };
  }

  async update(
    id: string,
    input: UpdateWarrantyTypeInput,
  ): Promise<{ warranty_type: PrimitiveWarrantyType }> {
    const existing = await this.warranty_type_repository.findOne({
      where: { id },
    });
    if (!existing) {
      throw new WarrantyTypeNotFoundException(id);
    }

    const next_name =
      input.name === undefined ? existing.name : input.name.trim();
    const next_description =
      input.description === undefined ? existing.description : input.description;
    const next_slug =
      input.name === undefined ? existing.slug : slugify(next_name);

    const row = await this.warranty_type_repository.preload({
      id,
      name: next_name,
      description: next_description,
      slug: next_slug,
    });
    if (!row) {
      throw new WarrantyTypeNotFoundException(id);
    }

    const saved = await this.warranty_type_repository.save(row);
    return { warranty_type: this.toPrimitive(saved) };
  }

  async findAll(
    query: PaginationHttpDto,
  ): Promise<PaginatedResult<PrimitiveWarrantyType>> {
    const filter = new CatalogPaginationFilter({ ...query });
    return runPaginatedTypeormFind({
      repository: this.warranty_type_repository,
      filter,
      map_row: (row) => this.toPrimitive(row),
      allowed_sort_keys: WARRANTY_TYPE_SORT_KEYS,
      default_sort_key: "created_at",
    });
  }

  async findOne(id: string): Promise<{ warranty_type: PrimitiveWarrantyType }> {
    const warranty_type = await this.findById(id);
    if (!warranty_type) {
      throw new WarrantyTypeNotFoundException(id);
    }
    return { warranty_type };
  }

  async findById(id: string): Promise<PrimitiveWarrantyType | null> {
    const row = await this.warranty_type_repository.findOne({ where: { id } });
    if (!row) {
      return null;
    }
    return this.toPrimitive(row);
  }

  async remove(id: string): Promise<void> {
    await this.warranty_type_repository.delete(id);
  }

  private toPrimitive(row: WarrantyTypeEntity): PrimitiveWarrantyType {
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
