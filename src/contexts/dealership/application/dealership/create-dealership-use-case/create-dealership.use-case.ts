import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { Dealership, PrimitiveDealership } from "../../../domain/entities/dealership";
import { CreateDealershipPayload } from "../../../domain/payloads/create-dealership.payload";
import { DealershipRepository } from "../../../domain/repositories/dealership.repository";
import { SyncDealershipMembersUseCase } from "../../dealership-members/sync-dealership-members-use-case/sync-dealership-members.use-case";

import { CreateDealershipDto } from "./create-dealership.dto";

@Injectable()
export class CreateDealershipUseCase {
  constructor(
    private readonly dealership_repository: DealershipRepository,
    private readonly sync_dealership_members_use_case: SyncDealershipMembersUseCase,
  ) {}

  async execute(create_dealership_dto: CreateDealershipDto): Promise<PrimitiveDealership> {
    const payload = this.to_create_payload(create_dealership_dto);
    const dealership = Dealership.create(payload);
    await this.dealership_repository.save(dealership);

    await this.sync_dealership_members_use_case.execute({
      dealership_id: dealership.toPrimitives().id,
      members: create_dealership_dto.members,
    });

    return dealership.toPrimitives();
  }

  private to_create_payload(dto: CreateDealershipDto): CreateDealershipPayload {
    const payload = new CreateDealershipPayload();
    payload.name = dto.name;
    payload.slug = dto.slug;
    payload.avatar_url = dto.avatar_url;
    payload.banner_url = dto.banner_url;
    payload.description = dto.description;
    payload.website_url = dto.website_url;
    payload.email = dto.email;
    payload.phone_code = dto.phone_code;
    payload.phone = dto.phone;
    payload.address = dto.address;
    payload.lat = dto.lat;
    payload.lng = dto.lng;
    return payload;
  }
}
