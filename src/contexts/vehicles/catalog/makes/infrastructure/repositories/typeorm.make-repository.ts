import { CatalogPaginationFilter } from "@/src/contexts/shared/domain/filters/catalog-pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";
import { runPaginatedTypeormFind } from "@/src/contexts/shared/infrastructure/typeorm/run-paginated-typeorm-find";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Make } from "../../domain/entities/make";
import { MakeNotFoundException } from "../../domain/exceptions/make-not-found.exception";
import { MakesRepository } from "../../domain/repositories/makes.repository";
import { MakeEntity } from "../persistence/make.entity";
import { VehicleEntity } from "@/src/contexts/vehicles/infrastructure/persistence/vehicle.entity";
import { SearchMakesFilter } from "../../domain/filters/searchMakes.filter";

const MAKE_SORT_KEYS = new Set(["id", "name", "slug", "created_at"]);

export class TypeormMakeRepository extends MakesRepository {
  constructor(
    @InjectRepository(MakeEntity)
    private readonly make_repository: Repository<MakeEntity>,
    @InjectRepository(VehicleEntity)
    private readonly vehicle_repository: Repository<VehicleEntity>,
  ) {
    super();
  }

  private async find_vehicle_count_by_make_ids(
    make_ids: number[],
    filters?: {
      province_id?: string;
      since_price?: number;
      until_price?: number;
    },
  ): Promise<Map<number, number>> {
    if (make_ids.length === 0) {
      return new Map();
    }

    const vehicle_count_query = this.vehicle_repository
      .createQueryBuilder("vehicle")
      .innerJoin("version", "version", "version.id = vehicle.version_id")
      .select("version.make_id", "make_id")
      .addSelect("COUNT(vehicle.id)", "vehicle_count")
      .where("version.make_id IN (:...make_ids)", { make_ids })
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
      .groupBy("version.make_id")
      .getRawMany<{ make_id: string; vehicle_count: string }>();

    const vehicle_count_by_make_id = new Map<number, number>();
    for (const row of rows) {
      vehicle_count_by_make_id.set(Number(row.make_id), Number(row.vehicle_count));
    }
    return vehicle_count_by_make_id;
  }

  async find_all(filter: CatalogPaginationFilter): Promise<PaginatedResult<Make>> {
    const result = await runPaginatedTypeormFind({
      repository: this.make_repository,
      filter,
      map_row: (row) =>
        Make.fromPrimitives({
          id: row.id,
          name: row.name,
          slug: row.slug,
          created_at: row.created_at,
        }),
      allowed_sort_keys: MAKE_SORT_KEYS,
      default_sort_key: "id",
      search_column: "name",
    });



    return result.map((make) => {
      const primitive_make = make.toPrimitives();
      return Make.fromPrimitives({
        ...primitive_make,
      });
    });
  }

  async findOne(id: number): Promise<Make | null> {
    const row = await this.make_repository.findOne({ where: { id } });
    if (!row) {
      return null;
    }
    return Make.fromPrimitives({
      id: row.id,
      name: row.name,
      slug: row.slug,
      created_at: row.created_at,
    });
  }

  async save(make: Make): Promise<Make> {
    const p = make.toPrimitives();
    if (p.id === undefined) {
      const saved = await this.make_repository.save(
        this.make_repository.create({ name: p.name, slug: p.slug }),
      );
      return Make.fromPrimitives({
        id: saved.id,
        name: saved.name,
        slug: saved.slug,
        created_at: saved.created_at,
      });
    }
    const row = await this.make_repository.preload({
      id: p.id,
      name: p.name,
      slug: p.slug,
    });
    if (!row) {
      throw new MakeNotFoundException(p.id);
    }
    const saved = await this.make_repository.save(row);
    return Make.fromPrimitives({
      id: saved.id,
      name: saved.name,
      slug: saved.slug,
      created_at: saved.created_at,
    });
  }

  async remove(id: number): Promise<void> {
    await this.make_repository.delete(id);
  }

  async findSearchMakes(filter: SearchMakesFilter): Promise<Make[]> {
    const { search, province_id, since_price, until_price } = filter;
    const search_query = this.make_repository
      .createQueryBuilder("make")
      .orderBy("make.name", "ASC")
      .take(10);

    if (typeof search === "string" && search.trim().length > 0) {
      search_query.where("make.name ILIKE :search", {
        search: `%${search.trim()}%`,
      });
    }

    const rows = await search_query.getMany();
    const make_ids = rows.map((row) => row.id);
    const vehicle_count_by_make_id = await this.find_vehicle_count_by_make_ids(make_ids, {
      province_id,
      since_price,
      until_price,
    });

    return rows.map((row) =>
      Make.fromPrimitives({
        id: row.id,
        name: row.name,
        slug: row.slug,
        created_at: row.created_at,
        vehicle_count: vehicle_count_by_make_id.get(row.id) ?? 0,
      }),
    );
  }
}
