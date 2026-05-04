import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { CatalogPaginationFilter } from "@/src/contexts/shared/domain/filters/catalog-pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";
import { PaginationHttpDto } from "@/src/contexts/shared/infrastructure/http-dtos/pagination.http-dto";
import {
  CatalogFuelType,
  PrimitiveCatalogFuelType,
} from "../../domain/entities/catalog-fuel-type";
import { CatalogFuelTypesRepository } from "../../domain/repositories/catalog-fuel-types.repository";
import { CatalogFuelTypeNotFoundException } from "../../domain/exceptions/catalog-fuel-type-not-found.exception";
import { CreateCatalogFuelTypeDto } from "./dto/create-catalog-fuel-type.dto";
import { UpdateCatalogFuelTypeDto } from "./dto/update-catalog-fuel-type.dto";

@Injectable()
export class CatalogFuelTypesUseCase {
  constructor(private readonly repository: CatalogFuelTypesRepository) {}

  async create(
    dto: CreateCatalogFuelTypeDto,
  ): Promise<{ fuel_type: PrimitiveCatalogFuelType }> {
    const saved = await this.repository.save(CatalogFuelType.create(dto));
    return { fuel_type: saved.toPrimitives() };
  }

  async update(
    id: number,
    dto: UpdateCatalogFuelTypeDto,
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
    query: PaginationHttpDto,
  ): Promise<PaginatedResult<PrimitiveCatalogFuelType>> {
    const filter = new CatalogPaginationFilter({ ...query });
    const page = await this.repository.find_all(filter);
    return page.map((x) => x.toPrimitives());
  }

  async findOne(id: number): Promise<{ fuel_type: PrimitiveCatalogFuelType }> {
    const row = await this.repository.findOne(id);
    if (!row) {
      throw new CatalogFuelTypeNotFoundException(id);
    }
    return { fuel_type: row.toPrimitives() };
  }

  async remove(id: number): Promise<void> {
    await this.repository.remove(id);
  }
}
