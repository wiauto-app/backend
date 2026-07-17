import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { CatalogPaginationFilter } from "@/src/contexts/shared/types/catalog-pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/types/paginated-result.vo";
import {
  CatalogFuelType,
  PrimitiveCatalogFuelType,
} from "../types/catalog-fuel-type";
import { CatalogFuelTypeNotFoundException } from "../exceptions/catalog-fuel-type-not-found.exception";
import { TypeormCatalogFuelTypeRepository } from "../repositories/typeorm.catalog-fuel-type-repository";

export interface CreateCatalogFuelTypeInput {
  fuel_id: number;
  name: string;
  can_charge: boolean;
}

export interface UpdateCatalogFuelTypeInput {
  fuel_id?: number;
  name?: string;
  can_charge?: boolean;
}

export interface FindAllFuelTypesInput {
  model_id?: number;
  page?: number;
  limit?: number;
  skip?: number;
  order_by?: string;
  order_direction?: "ASC" | "DESC";
  query?: string;
}

@Injectable()
export class CatalogFuelTypesService {
  constructor(private readonly repository: TypeormCatalogFuelTypeRepository) {}

  async create(
    dto: CreateCatalogFuelTypeInput,
  ): Promise<{ fuel_type: PrimitiveCatalogFuelType }> {
    const saved = await this.repository.save(CatalogFuelType.create(dto));
    return { fuel_type: saved.toPrimitives() };
  }

  async update(
    id: number,
    dto: UpdateCatalogFuelTypeInput,
  ): Promise<{ fuel_type: PrimitiveCatalogFuelType }> {
    const existing = await this.repository.findOne(id);
    if (!existing) {
      throw new CatalogFuelTypeNotFoundException(id);
    }
    const prev = existing.toPrimitives();
    const saved = await this.repository.save(
      existing.update({
        fuel_id: dto.fuel_id ?? prev.fuel_id,
        name: dto.name ?? prev.name,
        can_charge: dto.can_charge ?? prev.can_charge,
      }),
    );
    return { fuel_type: saved.toPrimitives() };
  }

  async findAll(
    query: FindAllFuelTypesInput,
  ): Promise<PaginatedResult<PrimitiveCatalogFuelType>> {
    const filter = new CatalogPaginationFilter({ ...query });
    const page = await this.repository.find_all(filter);
    return page.map((x) => x.toPrimitives());
  }

  async findOne(id: number): Promise<{ fuel_type: PrimitiveCatalogFuelType }> {
    const fuel_type = await this.findById(id);
    if (!fuel_type) {
      throw new CatalogFuelTypeNotFoundException(id);
    }
    return { fuel_type };
  }

  async findById(id: number): Promise<PrimitiveCatalogFuelType | null> {
    const row = await this.repository.findOne(id);
    return row ? row.toPrimitives() : null;
  }

  async remove(id: number): Promise<void> {
    await this.repository.remove(id);
  }
}
