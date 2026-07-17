import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { CatalogPaginationFilter } from "@/src/contexts/shared/types/catalog-pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/types/paginated-result.vo";
import { runPaginatedTypeormFind } from "@/src/contexts/shared/typeorm/run-paginated-typeorm-find";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Municipality as MunicipalityEntity } from "../entities/municipality.entity";
import { Municipality } from "../types/municipality";
import { MunicipalityNotFoundException } from "../exceptions/municipality-not-found.exception";
const MUNICIPALITY_SORT_KEYS = new Set([
  "id",
  "name",
  "slug",
  "ineCode",
  "nuts1",
  "nuts2",
  "nuts3"]);

const mapRowToMunicipality = (row: MunicipalityEntity): Municipality =>
  Municipality.fromPrimitives({
    id: row.id,
    name: row.name ?? null,
    ineCode: row.ineCode ?? null,
    nuts1: row.nuts1 ?? null,
    nuts2: row.nuts2 ?? null,
    nuts3: row.nuts3 ?? null,
    slug: row.slug,
    image_url: row.image_url ?? null,
  });

@Injectable()
export class TypeormMunicipalitiesRepository {
  constructor(
    @InjectRepository(MunicipalityEntity)
    private readonly repo: Repository<MunicipalityEntity>,
  ) {
  }

  async find_all(
    filter: CatalogPaginationFilter,
  ): Promise<PaginatedResult<Municipality>> {
    return runPaginatedTypeormFind({
      repository: this.repo,
      filter,
      map_row: mapRowToMunicipality,
      allowed_sort_keys: MUNICIPALITY_SORT_KEYS,
      default_sort_key: "name",
    });
  }

  async findOne(id: number): Promise<Municipality | null> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) {
      return null;
    }
    return mapRowToMunicipality(row);
  }

  async save(municipality: Municipality): Promise<void> {
    const p = municipality.toPrimitives();
    const preloaded = await this.repo.preload({
      id: p.id,
      name: p.name,
      image_url: p.image_url,
    });
    if (!preloaded) {
      throw new MunicipalityNotFoundException(p.id);
    }
    await this.repo.save(preloaded);
  }
}
