import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";

import { Comunity } from "@/src/contexts/locations/comunities/entities/comunity.entity";
import { Municipality } from "@/src/contexts/locations/municipalities/entities/municipality.entity";
import { Provinces } from "@/src/contexts/locations/provinces/entities/province.entity";

import { CatalogFuelTypeEntity } from "../../catalog/fuel_types/entities/catalog-fuel-type.entity";
import { MakeEntity } from "../../catalog/makes/entities/make.entity";
import { CatalogModelEntity } from "../../catalog/models/entities/catalog-model.entity";
import { CategoryEntity } from "../../entities/category.entity";
import { VehicleTypeEntity } from "../../entities/vehicle-type.entity";
import { VehicleSearchHistoryEntity } from "../entities/vehicle-search-history.entity";
import { VehicleSearchHistoryNotFoundException } from "../exceptions/vehicle-search-history-not-found.exception";
import type {
  VehicleSearchHistoryItem,
  VehicleSearchQuery,
} from "../types/vehicle-search-query";
import {
  buildVehicleSearchLabel,
  type VehicleSearchLabelNames,
} from "../utils/build-vehicle-search-label";
import {
  countVehicleSearchFilters,
  hashVehicleSearchQuery,
  isRecordableVehicleSearch,
  normalizeVehicleSearchQuery,
} from "../utils/normalize-vehicle-search-query";

export const VEHICLE_SEARCH_HISTORY_MAX_PER_USER = 50;
export const VEHICLE_SEARCH_HISTORY_DEFAULT_LIMIT = 20;

export interface RecordVehicleSearchInput {
  user_id: string;
  /** Params validados de GET /v1/vehicles (FindAllVehiclesHttpDto). */
  params: {
    page?: number;
    dealership_ids?: string[];
    profile_ids?: string[];
  };
  results_count: number | null;
}

interface FindVehicleSearchHistoryInput {
  user_id: string;
  limit?: number;
}

interface VehicleSearchHistoryByIdInput {
  user_id: string;
  id: string;
}

interface UpsertResultRow {
  inserted: boolean;
}

const sortBySlugOrder = <T extends { slug: string }>(
  rows: T[],
  slugs: string[],
): T[] =>
  [...rows].sort((a, b) => slugs.indexOf(a.slug) - slugs.indexOf(b.slug));

const toNames = (rows: { name: string | null }[]): string[] =>
  rows
    .map((row) => row.name?.trim() ?? "")
    .filter((name) => name.length > 0);

@Injectable()
export class VehicleSearchHistoryService {
  private readonly logger = new Logger(VehicleSearchHistoryService.name);

  constructor(
    @InjectRepository(VehicleSearchHistoryEntity)
    private readonly searchHistoryRepository: Repository<VehicleSearchHistoryEntity>,
    @InjectRepository(VehicleTypeEntity)
    private readonly vehicleTypeRepository: Repository<VehicleTypeEntity>,
    @InjectRepository(MakeEntity)
    private readonly makeRepository: Repository<MakeEntity>,
    @InjectRepository(CatalogModelEntity)
    private readonly modelRepository: Repository<CatalogModelEntity>,
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,
    @InjectRepository(CatalogFuelTypeEntity)
    private readonly fuelTypeRepository: Repository<CatalogFuelTypeEntity>,
    @InjectRepository(Provinces)
    private readonly provinceRepository: Repository<Provinces>,
    @InjectRepository(Comunity)
    private readonly communityRepository: Repository<Comunity>,
    @InjectRepository(Municipality)
    private readonly municipalityRepository: Repository<Municipality>,
  ) {}

  /**
   * Fire-and-forget: nunca lanza ni se espera desde el listado.
   * Cualquier error se registra en log y se descarta.
   */
  recordInBackground(input: RecordVehicleSearchInput): void {
    void Promise.resolve()
      .then(() => this.record(input))
      .catch((error: unknown) => {
        this.logger.warn(
          `No se pudo registrar la búsqueda del usuario ${input.user_id}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      });
  }

  async record(input: RecordVehicleSearchInput): Promise<void> {
    const query = normalizeVehicleSearchQuery(input.params);
    if (!isRecordableVehicleSearch({ params: input.params, query })) {
      return;
    }

    const names = await this.resolveLabelNames(query);
    const label = buildVehicleSearchLabel(query, names);
    const query_hash = hashVehicleSearchQuery(query);
    const filters_count = countVehicleSearchFilters(query);

    const rows: UpsertResultRow[] = await this.searchHistoryRepository.query(
      `
        INSERT INTO "vehicle_search_history" AS "history"
          ("user_id", "query", "query_hash", "label", "filters_count", "results_count", "search_count", "last_searched_at")
        VALUES ($1, $2::jsonb, $3, $4, $5, $6, 1, now())
        ON CONFLICT ("user_id", "query_hash") DO UPDATE SET
          "search_count" = "history"."search_count" + 1,
          "last_searched_at" = now(),
          "results_count" = EXCLUDED."results_count",
          "label" = EXCLUDED."label",
          "query" = EXCLUDED."query",
          "filters_count" = EXCLUDED."filters_count"
        RETURNING (xmax = 0) AS "inserted"
      `,
      [
        input.user_id,
        JSON.stringify(query),
        query_hash,
        label,
        filters_count,
        input.results_count,
      ],
    );

    if (rows[0]?.inserted) {
      await this.pruneOldest(input.user_id);
    }
  }

  async findAll(
    input: FindVehicleSearchHistoryInput,
  ): Promise<VehicleSearchHistoryItem[]> {
    const limit = Math.min(
      Math.max(input.limit ?? VEHICLE_SEARCH_HISTORY_DEFAULT_LIMIT, 1),
      VEHICLE_SEARCH_HISTORY_MAX_PER_USER,
    );

    const rows = await this.searchHistoryRepository.find({
      where: { user_id: input.user_id },
      order: { last_searched_at: "DESC", created_at: "DESC" },
      take: limit,
    });

    return rows.map((row) => ({
      id: row.id,
      query: row.query,
      label: row.label,
      filters_count: row.filters_count,
      results_count: row.results_count,
      search_count: row.search_count,
      last_searched_at: row.last_searched_at,
    }));
  }

  async remove(input: VehicleSearchHistoryByIdInput): Promise<void> {
    const result = await this.searchHistoryRepository.delete({
      id: input.id,
      user_id: input.user_id,
    });
    if (!result.affected) {
      throw new VehicleSearchHistoryNotFoundException(input.id);
    }
  }

  async clear(user_id: string): Promise<void> {
    await this.searchHistoryRepository.delete({ user_id });
  }

  private async pruneOldest(user_id: string): Promise<void> {
    await this.searchHistoryRepository.query(
      `
        DELETE FROM "vehicle_search_history"
        WHERE "id" IN (
          SELECT "id" FROM "vehicle_search_history"
          WHERE "user_id" = $1
          ORDER BY "last_searched_at" DESC, "created_at" DESC
          OFFSET $2
        )
      `,
      [user_id, VEHICLE_SEARCH_HISTORY_MAX_PER_USER],
    );
  }

  private async resolveLabelNames(
    query: VehicleSearchQuery,
  ): Promise<VehicleSearchLabelNames> {
    const makes_slugs = query.makes_slugs ?? [];
    const models_slugs = query.models_slugs ?? [];
    const categories_slugs = query.categories_slugs ?? [];
    const fuel_type_slugs = query.fuel_type_slugs ?? [];
    const municipalities_slugs = query.municipalities_slugs ?? [];
    const provinces_slugs = query.provinces_slugs ?? [];
    const communities_slugs = query.comunities_slugs ?? [];

    const [
      vehicle_type,
      makes,
      models,
      categories,
      fuels,
      municipalities,
      provinces,
      communities,
    ] = await Promise.all([
      query.type_slug
        ? this.vehicleTypeRepository.findOne({
          where: { slug: query.type_slug },
        })
        : Promise.resolve(null),
      makes_slugs.length > 0
        ? this.makeRepository.find({ where: { slug: In(makes_slugs) } })
        : Promise.resolve([]),
      models_slugs.length > 0
        ? this.modelRepository.find({ where: { slug: In(models_slugs) } })
        : Promise.resolve([]),
      categories_slugs.length > 0
        ? this.categoryRepository.find({
          where: { slug: In(categories_slugs) },
        })
        : Promise.resolve([]),
      fuel_type_slugs.length > 0
        ? this.fuelTypeRepository.find({ where: { slug: In(fuel_type_slugs) } })
        : Promise.resolve([]),
      municipalities_slugs.length > 0
        ? this.municipalityRepository.find({
          where: { slug: In(municipalities_slugs) },
        })
        : Promise.resolve([]),
      provinces_slugs.length > 0
        ? this.provinceRepository.find({ where: { slug: In(provinces_slugs) } })
        : Promise.resolve([]),
      communities_slugs.length > 0
        ? this.communityRepository.find({
          where: { slug: In(communities_slugs) },
        })
        : Promise.resolve([]),
    ]);

    return {
      vehicle_type: vehicle_type?.name ?? null,
      makes: toNames(sortBySlugOrder(makes, makes_slugs)),
      // Un mismo slug de modelo puede existir en varias marcas.
      models: [...new Set(toNames(sortBySlugOrder(models, models_slugs)))],
      categories: toNames(sortBySlugOrder(categories, categories_slugs)),
      fuels: toNames(sortBySlugOrder(fuels, fuel_type_slugs)),
      locations: [
        ...toNames(sortBySlugOrder(municipalities, municipalities_slugs)),
        ...toNames(sortBySlugOrder(provinces, provinces_slugs)),
        ...toNames(sortBySlugOrder(communities, communities_slugs)),
      ],
    };
  }
}
