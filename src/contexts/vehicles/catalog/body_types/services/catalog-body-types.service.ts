import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { CatalogPaginationFilter } from "@/src/contexts/shared/types/catalog-pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/types/paginated-result.vo";
import {
  CatalogBodyType,
  PrimitiveCatalogBodyType,
} from "../types/catalog-body-type";
import { CatalogBodyTypeNotFoundException } from "../exceptions/catalog-body-type-not-found.exception";
import { TypeormCatalogBodyTypeRepository } from "../repositories/typeorm.catalog-body-type-repository";

export interface CreateCatalogBodyTypeInput {
  body_type_id: number;
  doors: number;
  name: string;
}

export interface UpdateCatalogBodyTypeInput {
  body_type_id?: number;
  doors?: number;
  name?: string;
}

export interface FindAllBodyTypesInput {
  model_id?: number;
  page?: number;
  limit?: number;
  skip?: number;
  order_by?: string;
  order_direction?: "ASC" | "DESC";
  query?: string;
}

@Injectable()
export class CatalogBodyTypesService {
  constructor(private readonly repository: TypeormCatalogBodyTypeRepository) {}

  async create(
    dto: CreateCatalogBodyTypeInput,
  ): Promise<{ body_type: PrimitiveCatalogBodyType }> {
    const saved = await this.repository.save(CatalogBodyType.create(dto));
    return { body_type: saved.toPrimitives() };
  }

  async update(
    id: number,
    dto: UpdateCatalogBodyTypeInput,
  ): Promise<{ body_type: PrimitiveCatalogBodyType }> {
    const existing = await this.repository.findOne(id);
    if (!existing) {
      throw new CatalogBodyTypeNotFoundException(id);
    }
    const prev = existing.toPrimitives();
    const saved = await this.repository.save(
      existing.update({
        body_type_id: dto.body_type_id ?? prev.body_type_id,
        doors: dto.doors ?? prev.doors,
        name: dto.name ?? prev.name,
      }),
    );
    return { body_type: saved.toPrimitives() };
  }

  async findAll(
    query: FindAllBodyTypesInput,
  ): Promise<PaginatedResult<PrimitiveCatalogBodyType>> {
    const filter = new CatalogPaginationFilter({ ...query });
    const page = await this.repository.find_all(filter);
    return page.map((x) => x.toPrimitives());
  }

  async findOne(id: number): Promise<{ body_type: PrimitiveCatalogBodyType }> {
    const body_type = await this.findById(id);
    if (!body_type) {
      throw new CatalogBodyTypeNotFoundException(id);
    }
    return { body_type };
  }

  async findById(id: number): Promise<PrimitiveCatalogBodyType | null> {
    const row = await this.repository.findOne(id);
    return row ? row.toPrimitives() : null;
  }

  async remove(id: number): Promise<void> {
    await this.repository.remove(id);
  }
}
