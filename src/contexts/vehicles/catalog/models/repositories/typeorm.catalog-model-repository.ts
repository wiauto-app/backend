import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { CatalogPaginationFilter } from "@/src/contexts/shared/types/catalog-pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/types/paginated-result.vo";
import { runPaginatedTypeormFind } from "@/src/contexts/shared/typeorm/run-paginated-typeorm-find";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { VehicleEntity } from "@/src/contexts/vehicles/entities/vehicle.entity";
import { CatalogModel } from "../types/catalog-model";
import { CatalogModelSearchItem } from "../types/catalog-model-search-item";
import { CatalogModelNotFoundException } from "../exceptions/catalog-model-not-found.exception";
import { SearchModelsFilter } from "../types/searchModels.filter";
import { CatalogModelEntity } from "../entities/catalog-model.entity";

const CATALOG_MODEL_SORT_KEYS = new Set([
  "id",
  "make_id",
  "model_id",
  "name",
  "slug",
  "created_at",
]);

@Injectable()
export class TypeormCatalogModelRepository {
  constructor(
    @InjectRepository(CatalogModelEntity)
    private readonly repo: Repository<CatalogModelEntity>,
    @InjectRepository(VehicleEntity)
    private readonly vehicle_repository: Repository<VehicleEntity>,
  ) {}

  private async find_vehicle_count_by_model_ids(
    make_id: number,
    model_ids: number[],
    filters?: {
      province_id?: string;
      since_price?: number;
      until_price?: number;
    },
  ): Promise<Map<number, number>> {
    if (model_ids.length === 0) {
      return new Map();
    }


    const vehicle_count_query = this.vehicle_repository
      .createQueryBuilder("vehicle")
      .leftJoin("version", "version", "version.id = vehicle.version_id")
      .select("version.model_id", "model_id")
      .addSelect("COUNT(vehicle.id)", "vehicle_count")
      .where("version.make_id = :make_id", { make_id })
      .andWhere("version.model_id IN (:...model_ids)", { model_ids })
      .andWhere("vehicle.deleted_at IS NULL");

    if (typeof filters?.since_price === "number" && Number.isFinite(filters.since_price)) {
      vehicle_count_query
        .innerJoin(
          "vehicle_prices",
          "price_filter_vp",
          "price_filter_vp.vehicle_id = vehicle.id AND price_filter_vp.status = 'active'",
        )
        .andWhere("price_filter_vp.price >= :since_price", {
          since_price: filters.since_price,
        });
    }

    if (typeof filters?.until_price === "number" && Number.isFinite(filters.until_price)) {
      if (
        typeof filters.since_price !== "number" ||
        !Number.isFinite(filters.since_price)
      ) {
        vehicle_count_query.innerJoin(
          "vehicle_prices",
          "price_filter_vp",
          "price_filter_vp.vehicle_id = vehicle.id AND price_filter_vp.status = 'active'",
        );
      }
      vehicle_count_query.andWhere("price_filter_vp.price <= :until_price", {
        until_price: filters.until_price,
      });
    }

    if (typeof filters?.province_id === "string" && filters.province_id.trim().length > 0) {
      vehicle_count_query.andWhere(
        `EXISTS (
          SELECT 1
          FROM provinces loc_p
          WHERE loc_p.id = :province_id
            AND ST_Intersects(
              ST_SetSRID(
                ST_MakePoint(CAST(vehicle.lng AS double precision), CAST(vehicle.lat AS double precision)),
                4326
              ),
              loc_p.geom
            )
        )`,
        { province_id: filters.province_id.trim() },
      );
    }

    const rows = await vehicle_count_query
      .groupBy("version.model_id")
      .getRawMany<{ model_id: string; vehicle_count: string }>();
    const vehicle_count_by_model_id = new Map<number, number>();
    for (const row of rows) {
      vehicle_count_by_model_id.set(Number(row.model_id), Number(row.vehicle_count));
    }
    return vehicle_count_by_model_id;
  }

  async find_all(filter: CatalogPaginationFilter): Promise<PaginatedResult<CatalogModel>> {
    return runPaginatedTypeormFind({
      repository: this.repo,
      filter,
      map_row: (row) =>
        CatalogModel.fromPrimitives({
          id: row.id,
          make_id: row.make_id,
          model_id: row.model_id,
          name: row.name,
          slug: row.slug,
          created_at: row.created_at,
        }),
      extra_filters: { make_id: filter.make_id },
      allowed_sort_keys: CATALOG_MODEL_SORT_KEYS,
      default_sort_key: "id",
    });
  }

  async findOne(id: number): Promise<CatalogModel | null> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) {
      return null;
    }
    return CatalogModel.fromPrimitives({
      id: row.id,
      make_id: row.make_id,
      model_id: row.model_id,
      name: row.name,
      slug: row.slug,
      created_at: row.created_at,
    });
  }

  async save(row: CatalogModel): Promise<CatalogModel> {
    const p = row.toPrimitives();
    if (p.id === undefined) {
      const saved = await this.repo.save(
        this.repo.create({
          make_id: p.make_id,
          model_id: p.model_id,
          name: p.name,
          slug: p.slug,
        }),
      );
      return CatalogModel.fromPrimitives({
        id: saved.id,
        make_id: saved.make_id,
        model_id: saved.model_id,
        name: saved.name,
        slug: saved.slug,
        created_at: saved.created_at,
      });
    }
    const pre = await this.repo.preload({
      id: p.id,
      make_id: p.make_id,
      model_id: p.model_id,
      name: p.name,
      slug: p.slug,
    });
    if (!pre) {
      throw new CatalogModelNotFoundException(p.id);
    }
    const saved = await this.repo.save(pre);
    return CatalogModel.fromPrimitives({
      id: saved.id,
      make_id: saved.make_id,
      model_id: saved.model_id,
      name: saved.name,
      slug: saved.slug,
      created_at: saved.created_at,
    });
  }

  async remove(id: number): Promise<void> {
    await this.repo.delete(id);
  }

  async findSearchModels(filter: SearchModelsFilter): Promise<CatalogModelSearchItem[]> {
    const { make_id, search, province_id, since_price, until_price } = filter;
    const search_query = this.repo
      .createQueryBuilder("model")
      .where("model.make_id = :make_id", { make_id })
      .orderBy("model.name", "ASC")
      .take(filter.limit);

    if (typeof search === "string" && search.trim().length > 0) {
      search_query.andWhere("model.name ILIKE :search", {
        search: `%${search.trim()}%`,
      });
    }

    const rows = await search_query.getMany();
    const model_ids = rows.map((row) => row.id);
    const vehicle_count_by_model_id = await this.find_vehicle_count_by_model_ids(
      make_id,
      model_ids,
      {
        province_id,
        since_price,
        until_price,
      },
    );

    return rows.map((row) => ({
      id: row.id,
      make_id: row.make_id,
      model_id: row.model_id,
      name: row.name,
      slug: row.slug,
      created_at: row.created_at,
      vehicle_count: vehicle_count_by_model_id.get(row.id) ?? 0,
    })).filter((model) => model.vehicle_count > 0);
  }

  async findGlobalSearchModels(
    search: string,
    limit: number,
  ): Promise<CatalogModelSearchItem[]> {
    const query = search.trim();
    if (!query) {
      return [];
    }

    const slugifiedQuery = query.toLowerCase().replace(/\s+/g, "-");
    const search_query = this.repo
      .createQueryBuilder("model")
      .orderBy("model.name", "ASC")
      .take(limit);

    search_query.andWhere(
      "(model.name ILIKE :search OR model.slug ILIKE :slugSearch)",
      {
        search: `%${query}%`,
        slugSearch: `%${slugifiedQuery}%`,
      },
    );

    const rows = await search_query.getMany();
    const models_by_make = new Map<number, typeof rows>();

    for (const row of rows) {
      const group = models_by_make.get(row.make_id) ?? [];
      group.push(row);
      models_by_make.set(row.make_id, group);
    }

    const results: CatalogModelSearchItem[] = [];

    for (const [make_id, make_rows] of models_by_make) {
      const model_ids = make_rows.map((row) => row.id);
      const vehicle_count_by_model_id = await this.find_vehicle_count_by_model_ids(
        make_id,
        model_ids,
      );

      for (const row of make_rows) {
        const vehicle_count = vehicle_count_by_model_id.get(row.id) ?? 0;
        if (vehicle_count === 0) {
          continue;
        }

        results.push({
          id: row.id,
          make_id: row.make_id,
          model_id: row.model_id,
          name: row.name,
          slug: row.slug,
          created_at: row.created_at,
          vehicle_count,
        });
      }
    }

    return results;
  }
}
