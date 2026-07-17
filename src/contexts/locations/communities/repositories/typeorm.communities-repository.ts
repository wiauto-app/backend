import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { CatalogPaginationFilter } from "@/src/contexts/shared/types/catalog-pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/types/paginated-result.vo";
import { runPaginatedTypeormFind } from "@/src/contexts/shared/typeorm/run-paginated-typeorm-find";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Comunity } from "@/src/contexts/locations/comunities/entities/comunity.entity";
import { Community } from "../types/community";
import { CommunityNotFoundException } from "../exceptions/community-not-found.exception";
const COMMUNITY_SORT_KEYS = new Set([
  "id",
  "name",
  "slug",
  "cod_ccaa",
  "noml_ccaa",
  "ogc_fid"]);

const mapRowToCommunity = (row: Comunity): Community =>
  Community.fromPrimitives({
    id: row.id,
    ogc_fid: row.ogc_fid,
    cod_ccaa: row.cod_ccaa,
    noml_ccaa: row.noml_ccaa ?? null,
    name: row.name ?? null,
    slug: row.slug,
    cartodb_id: row.cartodb_id ?? null,
    image_url: row.image_url ?? null,
  });

@Injectable()
export class TypeormCommunitiesRepository {
  constructor(
    @InjectRepository(Comunity)
    private readonly repo: Repository<Comunity>,
  ) {
  }

  async find_all(
    filter: CatalogPaginationFilter,
  ): Promise<PaginatedResult<Community>> {
    return runPaginatedTypeormFind({
      repository: this.repo,
      filter,
      map_row: mapRowToCommunity,
      allowed_sort_keys: COMMUNITY_SORT_KEYS,
      default_sort_key: "name",
    });
  }

  async findOne(id: number): Promise<Community | null> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) {
      return null;
    }
    return mapRowToCommunity(row);
  }

  async save(community: Community): Promise<void> {
    const p = community.toPrimitives();
    const preloaded = await this.repo.preload({
      id: p.id,
      name: p.name,
      image_url: p.image_url,
    });
    if (!preloaded) {
      throw new CommunityNotFoundException(p.id);
    }
    await this.repo.save(preloaded);
  }
}
