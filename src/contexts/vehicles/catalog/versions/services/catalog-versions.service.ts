import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { CatalogPaginationFilter } from "@/src/contexts/shared/types/catalog-pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/types/paginated-result.vo";
import {
  CatalogVersion,
  PrimitiveCatalogVersion,
} from "../types/catalog-version";
import { CatalogVersionNotFoundException } from "../exceptions/catalog-version-not-found.exception";
import { TypeormCatalogVersionRepository } from "../repositories/typeorm.catalog-version-repository";

export interface CreateCatalogVersionInput {
  make_id: number;
  model_id: number;
  body_type_id: number;
  fuel_type_id: number;
  year_id: number;
  name: string;
  version_id?: number | null;
}

export interface UpdateCatalogVersionInput {
  make_id?: number;
  model_id?: number;
  body_type_id?: number;
  fuel_type_id?: number;
  year_id?: number;
  name?: string;
  version_id?: number | null;
}

export interface FindAllVersionsInput {
  model_id?: number;
  fuel_type_id?: number;
  year_id?: number;
  page?: number;
  limit?: number;
  skip?: number;
  order_by?: string;
  order_direction?: "ASC" | "DESC";
  query?: string;
}

@Injectable()
export class CatalogVersionsService {
  constructor(private readonly repository: TypeormCatalogVersionRepository) {}

  async create(
    dto: CreateCatalogVersionInput,
  ): Promise<{ version: PrimitiveCatalogVersion }> {
    const saved = await this.repository.save(CatalogVersion.create(dto));
    return { version: saved.toPrimitives() };
  }

  async update(
    id: number,
    dto: UpdateCatalogVersionInput,
  ): Promise<{ version: PrimitiveCatalogVersion }> {
    const existing = await this.repository.findOne(id);
    if (!existing) {
      throw new CatalogVersionNotFoundException(id);
    }
    const prev = existing.toPrimitives();
    const saved = await this.repository.save(
      existing.update({
        make_id: dto.make_id ?? prev.make_id,
        model_id: dto.model_id ?? prev.model_id,
        body_type_id: dto.body_type_id ?? prev.body_type_id,
        fuel_type_id: dto.fuel_type_id ?? prev.fuel_type_id,
        year_id: dto.year_id ?? prev.year_id,
        name: dto.name ?? prev.name,
        version_id:
          dto.version_id === undefined ? prev.version_id : dto.version_id,
      }),
    );
    return { version: saved.toPrimitives() };
  }

  async findAll(
    query: FindAllVersionsInput,
  ): Promise<PaginatedResult<PrimitiveCatalogVersion>> {
    const filter = new CatalogPaginationFilter({ ...query });
    const page = await this.repository.find_all(filter);
    return page.map((x) => x.toPrimitives());
  }

  async findOne(id: number): Promise<{ version: PrimitiveCatalogVersion }> {
    const version = await this.findById(id);
    if (!version) {
      throw new CatalogVersionNotFoundException(id);
    }
    return { version };
  }

  async findById(id: number): Promise<PrimitiveCatalogVersion | null> {
    const row = await this.repository.findOne(id);
    return row ? row.toPrimitives() : null;
  }

  async remove(id: number): Promise<void> {
    await this.repository.remove(id);
  }
}
