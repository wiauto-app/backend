import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { CatalogPaginationFilter } from "@/src/contexts/shared/types/catalog-pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/types/paginated-result.vo";
import {
  CatalogModel,
  PrimitiveCatalogModel,
} from "../types/catalog-model";
import { CatalogModelNotFoundException } from "../exceptions/catalog-model-not-found.exception";
import { SearchModelsFilter } from "../types/searchModels.filter";
import { CatalogModelSearchItem } from "../types/catalog-model-search-item";
import { TypeormCatalogModelRepository } from "../repositories/typeorm.catalog-model-repository";

export interface CreateCatalogModelInput {
  make_id: number;
  model_id: number;
  name: string;
}

export interface UpdateCatalogModelInput {
  make_id?: number;
  model_id?: number;
  name?: string;
}

export interface FindAllModelsInput {
  make_id?: number;
  page?: number;
  limit?: number;
  skip?: number;
  order_by?: string;
  order_direction?: "ASC" | "DESC";
  query?: string;
}

export interface FindSearchModelsInput {
  make_id: number;
  search?: string;
  province_id?: string;
  since_price?: number;
  until_price?: number;
  page?: number;
  limit?: number;
  order_direction?: "ASC" | "DESC";
  query?: string;
  order_by?: string;
}

@Injectable()
export class CatalogModelsService {
  constructor(private readonly repository: TypeormCatalogModelRepository) {}

  async create(
    dto: CreateCatalogModelInput,
  ): Promise<{ model: PrimitiveCatalogModel }> {
    const saved = await this.repository.save(CatalogModel.create(dto));
    return { model: saved.toPrimitives() };
  }

  async update(
    id: number,
    dto: UpdateCatalogModelInput,
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
    dto: FindAllModelsInput,
  ): Promise<PaginatedResult<PrimitiveCatalogModel>> {
    const filter = new CatalogPaginationFilter({ ...dto });
    const page = await this.repository.find_all(filter);
    return page.map((x) => x.toPrimitives());
  }

  async findOne(id: number): Promise<{ model: PrimitiveCatalogModel }> {
    const model = await this.findById(id);
    if (!model) {
      throw new CatalogModelNotFoundException(id);
    }
    return { model };
  }

  async findById(id: number): Promise<PrimitiveCatalogModel | null> {
    const row = await this.repository.findOne(id);
    return row ? row.toPrimitives() : null;
  }

  async remove(id: number): Promise<void> {
    await this.repository.remove(id);
  }

  async findSearchModels(
    dto: FindSearchModelsInput,
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

  async findGlobalSearchModels(
    search: string,
    limit = 15,
  ): Promise<{ models: CatalogModelSearchItem[] }> {
    const models = await this.repository.findGlobalSearchModels(search, limit);
    return { models };
  }
}
