import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { CatalogPaginationFilter } from "@/src/contexts/shared/domain/filters/catalog-pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";
import {
  CatalogModel,
  PrimitiveCatalogModel,
} from "../../domain/entities/catalog-model";
import { CatalogModelsRepository } from "../../domain/repositories/catalog-models.repository";
import { CatalogModelNotFoundException } from "../../domain/exceptions/catalog-model-not-found.exception";
import { CreateCatalogModelDto } from "./dto/create-catalog-model.dto";
import { UpdateCatalogModelDto } from "./dto/update-catalog-model.dto";
import { FindAllModelDto } from "./dto/find-all-model.dto";
import { FindSearchModelsDto } from "./dto/find-search-models.dto";
import { SearchModelsFilter } from "../../domain/filters/searchModels.filter";
import { CatalogModelSearchItem } from "../../domain/read-models/catalog-model-search-item";

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
    dto: FindAllModelDto,
  ): Promise<PaginatedResult<PrimitiveCatalogModel>> {
    const filter = new CatalogPaginationFilter({ ...dto });
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

  async findSearchModels(
    dto: FindSearchModelsDto,
  ): Promise<{ models: CatalogModelSearchItem[] }> {
    const filter = new SearchModelsFilter({
      make_id: dto.make_id,
      search: dto.search,
      province_id: dto.province_id,
      since_price: dto.since_price,
      until_price: dto.until_price,
      page: dto.page,
      limit: dto.limit,
      order_direction: dto.order_direction,
      query: dto.query,
      order_by: dto.order_by,
    });
    const models = await this.repository.findSearchModels(filter);
    return { models };
  }
}
