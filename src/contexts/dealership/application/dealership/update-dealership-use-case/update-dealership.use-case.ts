import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { PrimitiveDealership } from "../../../domain/entities/dealership";
import { DealershipNotFoundException } from "../../../domain/exceptions/dealership-not-found.exception";
import { UpdateDealershipPayload } from "../../../domain/payloads/update-dealership.payload";
import { DealershipRepository } from "../../../domain/repositories/dealership.repository";
import { SyncDealershipMembersUseCase } from "../../dealership-members/sync-dealership-members-use-case/sync-dealership-members.use-case";

import { UpdateDealershipDto } from "./update-dealership.dto";

@Injectable()
export class UpdateDealershipUseCase {
  constructor(
    private readonly dealership_repository: DealershipRepository,
    private readonly sync_dealership_members_use_case: SyncDealershipMembersUseCase,
  ) {}

  async execute(update_dealership_dto: UpdateDealershipDto): Promise<PrimitiveDealership> {
    const { id, members, ...patch_fields } = update_dealership_dto;
    const dealership = await this.dealership_repository.findOne(id);
    if (!dealership) {
      throw new DealershipNotFoundException(id);
    }
    const payload: UpdateDealershipPayload = { ...patch_fields };
    const updated = dealership.update(payload);
    await this.dealership_repository.update(updated);

    if (members !== undefined) {
      await this.sync_dealership_members_use_case.execute({
        dealership_id: id,
        members,
      });
    }

    return updated.toPrimitives();
  }
}
