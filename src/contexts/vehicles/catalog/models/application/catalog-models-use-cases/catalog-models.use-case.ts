import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { CatalogPaginationFilter } from "@/src/contexts/shared/domain/filters/catalog-pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";
import { PaginationHttpDto } from "@/src/contexts/shared/infrastructure/http-dtos/pagination.http-dto";
import {
  CatalogModel,
  PrimitiveCatalogModel,
} from "../../domain/entities/catalog-model";
import { CatalogModelsRepository } from "../../domain/repositories/catalog-models.repository";
import { CatalogModelNotFoundException } from "../../domain/exceptions/catalog-model-not-found.exception";
import { CreateCatalogModelDto } from "./dto/create-catalog-model.dto";
import { UpdateCatalogModelDto } from "./dto/update-catalog-model.dto";

@Injectable()
export class CatalogModelsUseCase {
  constructor(private readonly repository: CatalogModelsRepository) {}

  async create(dto: CreateCatalogModelDto): Promise<{ model: PrimitiveCatalogModel }> {
    const saved = await this.repository.save(CatalogModel.create(dto));
    return { model: saved.toPrimitives() };
  }

  async update(
    id: number,
    dto: UpdateCatalogModelDto,
  ): Promise<{ model: PrimitiveCatalogModel }> {
    const existing = await this.repository.findOne(id);
    if (!existing) {
      throw new CatalogModelNotFoundException(id);
    }
    const prev = existing.toPrimitives();
    const saved = await this.repository.save(
      existing.update({
        make_id: dto.make_id ?? prev.make_id,
        model_id: dto.model_id ?? prev.model_id,
        name: dto.name ?? prev.name,
      }),
    );
    return { model: saved.toPrimitives() };
  }

  async findAll(
    query: PaginationHttpDto,
  ): Promise<PaginatedResult<PrimitiveCatalogModel>> {
    const filter = new CatalogPaginationFilter({ ...query });
    const page = await this.repository.find_all(filter);
    return page.map((x) => x.toPrimitives());
  }

  async findOne(id: number): Promise<{ model: PrimitiveCatalogModel }> {
    const row = await this.repository.findOne(id);
    if (!row) {
      throw new CatalogModelNotFoundException(id);
    }
    return { model: row.toPrimitives() };
  }

  async remove(id: number): Promise<void> {
    await this.repository.remove(id);
  }
}
