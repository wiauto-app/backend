import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { DealershipNotFoundException } from "../../../domain/exceptions/dealership-not-found.exception";
import { DealershipDetail } from "../../../domain/read-models/dealership-detail";
import { DealershipMemberRepository } from "../../../domain/repositories/dealership-member.repository";
import { DealershipRepository } from "../../../domain/repositories/dealership.repository";

import { FindOneDealershipBySlugDto } from "./find-one-dealership-by-slug.dto";

@Injectable()
export class FindOneDealershipBySlugUseCase {
  constructor(
    private readonly dealership_repository: DealershipRepository,
    private readonly dealership_member_repository: DealershipMemberRepository,
  ) {}

  async execute(
    find_one_dealership_by_slug_dto: FindOneDealershipBySlugDto,
  ): Promise<DealershipDetail> {
    const dealership = await this.dealership_repository.findOneBySlug(
      find_one_dealership_by_slug_dto.slug,
    );
    if (!dealership) {
      throw new DealershipNotFoundException(find_one_dealership_by_slug_dto.slug);
    }

    const primitives = dealership.toPrimitives();
    const members = await this.dealership_member_repository.findAllByDealershipId(
      primitives.id,
    );

    const should_hide_phone = primitives.show_phone === false;

    return {
      ...primitives,
      phone: should_hide_phone ? "" : primitives.phone,
      phone_code: should_hide_phone ? "" : primitives.phone_code,
      members,
    };
  }
}
