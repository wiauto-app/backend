import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { PrimitiveProfile } from "../../../domain/entities/profile";
import { ProfileRepository } from "../../../domain/repositories/profile.repository";
import { FindAllProfilesDto } from "./find-all-profiles.dto";
import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";
import { ProfileFilter } from "../../../domain/filters/profile.filter";

@Injectable()
export class FindAllProfilesUseCase {
  constructor(private readonly profile_repository: ProfileRepository) { }

  async execute(dto: FindAllProfilesDto): Promise<PaginatedResult<PrimitiveProfile>> {
    const filter = new ProfileFilter(dto);
    const profiles = await this.profile_repository.findAll(filter);
    return profiles.map((profile) => profile.toPrimitives());
  }
}
