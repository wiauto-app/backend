import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { CatalogPaginationFilter } from "@/src/contexts/shared/domain/filters/catalog-pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";
import { PaginationHttpDto } from "@/src/contexts/shared/infrastructure/http-dtos/pagination.http-dto";

import { PrimitiveCommunity } from "../../domain/entities/community";
import { CommunityNotFoundException } from "../../domain/exceptions/community-not-found.exception";
import { CommunitiesRepository } from "../../domain/repositories/communities.repository";
import { UpdateCommunityDto } from "./dto/update-community.dto";

const parseCommunityId = (id: string): number => {
  const parsed = Number.parseInt(id, 10);
  if (!Number.isFinite(parsed)) {
    throw new CommunityNotFoundException(id);
  }
  return parsed;
};

@Injectable()
export class CommunitiesUseCase {
  constructor(private readonly communities_repository: CommunitiesRepository) {}

  async update(
    id: string,
    update_community_dto: UpdateCommunityDto,
  ): Promise<{ community: PrimitiveCommunity }> {
    const community_id = parseCommunityId(id);
    const existing = await this.communities_repository.findOne(community_id);
    if (!existing) {
      throw new CommunityNotFoundException(id);
    }
    const previous = existing.toPrimitives();
    const updated = existing.update({
      name:
        update_community_dto.name !== undefined
          ? update_community_dto.name
          : previous.name,
      image_url:
        update_community_dto.image_url !== undefined
          ? update_community_dto.image_url
          : previous.image_url,
    });
    await this.communities_repository.save(updated);
    return { community: updated.toPrimitives() };
  }

  async findAll(
    query: PaginationHttpDto,
  ): Promise<PaginatedResult<PrimitiveCommunity>> {
    const filter = new CatalogPaginationFilter({ ...query });
    const page = await this.communities_repository.find_all(filter);
    return page.map((community) => community.toPrimitives());
  }

  async findOne(id: string): Promise<{ community: PrimitiveCommunity }> {
    const community_id = parseCommunityId(id);
    const community = await this.communities_repository.findOne(community_id);
    if (!community) {
      throw new CommunityNotFoundException(id);
    }
    return { community: community.toPrimitives() };
  }
}
