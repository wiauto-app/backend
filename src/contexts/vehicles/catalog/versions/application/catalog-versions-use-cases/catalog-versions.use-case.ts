import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { CatalogPaginationFilter } from "@/src/contexts/shared/domain/filters/catalog-pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";
import { PaginationHttpDto } from "@/src/contexts/shared/infrastructure/http-dtos/pagination.http-dto";
import {
  CatalogVersion,
  PrimitiveCatalogVersion,
} from "../../domain/entities/catalog-version";
import { CatalogVersionsRepository } from "../../domain/repositories/catalog-versions.repository";
import { CatalogVersionNotFoundException } from "../../domain/exceptions/catalog-version-not-found.exception";
import { CreateCatalogVersionDto } from "./dto/create-catalog-version.dto";
import { UpdateCatalogVersionDto } from "./dto/update-catalog-version.dto";

@Injectable()
export class CatalogVersionsUseCase {
  constructor(private readonly repository: CatalogVersionsRepository) {}

  async create(
    dto: CreateCatalogVersionDto,
  ): Promise<{ version: PrimitiveCatalogVersion }> {
    const saved = await this.repository.save(CatalogVersion.create(dto));
    return { version: saved.toPrimitives() };
  }

  async update(
    id: number,
    dto: UpdateCatalogVersionDto,
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
      }),
    );
    return { version: saved.toPrimitives() };
  }

  async findAll(
    query: PaginationHttpDto,
  ): Promise<PaginatedResult<PrimitiveCatalogVersion>> {
    const filter = new CatalogPaginationFilter({ ...query });
    const page = await this.repository.find_all(filter);
    return page.map((x) => x.toPrimitives());
  }

  async findOne(id: number): Promise<{ version: PrimitiveCatalogVersion }> {
    const row = await this.repository.findOne(id);
    if (!row) {
      throw new CatalogVersionNotFoundException(id);
    }
    return { version: row.toPrimitives() };
  }

  async remove(id: number): Promise<void> {
    await this.repository.remove(id);
  }
}
