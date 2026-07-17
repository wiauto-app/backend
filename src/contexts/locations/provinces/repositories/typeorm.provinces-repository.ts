import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { CatalogPaginationFilter } from "@/src/contexts/shared/types/catalog-pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/types/paginated-result.vo";
import { runPaginatedTypeormFind } from "@/src/contexts/shared/typeorm/run-paginated-typeorm-find";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Provinces } from "../entities/province.entity";
import { Province } from "../types/province";
import { ProvinceNotFoundException } from "../exceptions/province-not-found.exception";
const PROVINCE_SORT_KEYS = new Set([
  "id",
  "name",
  "slug",
  "cod_prov",
  "cod_ccaa",
  "ogc_fid"]);

const mapRowToProvince = (row: Provinces): Province =>
  Province.fromPrimitives({
    id: row.id,
    ogc_fid: row.ogc_fid,
    cod_prov: row.cod_prov,
    name: row.name,
    cod_ccaa: row.cod_ccaa,
    slug: row.slug,
    cartodb_id: row.cartodb_id ?? null,
    image_url: row.image_url ?? null,
  });

@Injectable()
export class TypeormProvincesRepository {
  constructor(
    @InjectRepository(Provinces)
    private readonly repo: Repository<Provinces>,
  ) {
  }

  async find_all(
    filter: CatalogPaginationFilter,
  ): Promise<PaginatedResult<Province>> {
    return runPaginatedTypeormFind({
      repository: this.repo,
      filter,
      map_row: mapRowToProvince,
      allowed_sort_keys: PROVINCE_SORT_KEYS,
      default_sort_key: "name",
    });
  }

  async findOne(id: number): Promise<Province | null> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) {
      return null;
    }
    return mapRowToProvince(row);
  }

  async save(province: Province): Promise<void> {
    const p = province.toPrimitives();
    const preloaded = await this.repo.preload({
      id: p.id,
      name: p.name,
      image_url: p.image_url,
    });
    if (!preloaded) {
      throw new ProvinceNotFoundException(p.id);
    }
    await this.repo.save(preloaded);
  }
}
