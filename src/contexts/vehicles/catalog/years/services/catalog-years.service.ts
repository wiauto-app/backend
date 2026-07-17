import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { CatalogPaginationFilter } from "@/src/contexts/shared/types/catalog-pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/types/paginated-result.vo";
import {
  CatalogYear,
  PrimitiveCatalogYear,
} from "../types/catalog-year";
import { CatalogYearNotFoundException } from "../exceptions/catalog-year-not-found.exception";
import { TypeormCatalogYearRepository } from "../repositories/typeorm.catalog-year-repository";

export interface CreateCatalogYearInput {
  year: number;
}

export interface UpdateCatalogYearInput {
  year?: number;
}

export interface FindAllYearsInput {
  model_id?: number;
  body_type_id?: number;
  page?: number;
  limit?: number;
  skip?: number;
  order_by?: string;
  order_direction?: "ASC" | "DESC";
  query?: string;
}

@Injectable()
export class CatalogYearsService {
  constructor(private readonly repository: TypeormCatalogYearRepository) {}

  async create(
    dto: CreateCatalogYearInput,
  ): Promise<{ year: PrimitiveCatalogYear }> {
    const saved = await this.repository.save(CatalogYear.create(dto));
    return { year: saved.toPrimitives() };
  }

  async update(
    id: number,
    dto: UpdateCatalogYearInput,
  ): Promise<{ year: PrimitiveCatalogYear }> {
    const existing = await this.repository.findOne(id);
    if (!existing) {
      throw new CatalogYearNotFoundException(id);
    }
    const prev = existing.toPrimitives();
    const next_year = dto.year ?? prev.year;
    const saved = await this.repository.save(
      existing.update({ year: next_year }),
    );
    return { year: saved.toPrimitives() };
  }

  async findAll(
    query: FindAllYearsInput,
  ): Promise<PaginatedResult<PrimitiveCatalogYear>> {
    const filter = new CatalogPaginationFilter({ ...query });
    const page = await this.repository.find_all(filter);
    return page.map((y) => y.toPrimitives());
  }

  async findOne(id: number): Promise<{ year: PrimitiveCatalogYear }> {
    const year = await this.findById(id);
    if (!year) {
      throw new CatalogYearNotFoundException(id);
    }
    return { year };
  }

  async findById(id: number): Promise<PrimitiveCatalogYear | null> {
    const row = await this.repository.findOne(id);
    return row ? row.toPrimitives() : null;
  }

  async remove(id: number): Promise<void> {
    await this.repository.remove(id);
  }
}
