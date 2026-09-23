import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Repository } from "typeorm";

import { FeaturedListingCreditEntity } from "../entities/featured-listing-credit.entity";

export interface AddFeaturedListingCreditParams {
  profile_id: string;
  offer_id?: string | null;
  duration_days: number;
  boost_weight: number;
  stripe_checkout_session_id?: string | null;
}

@Injectable()
export class FeaturedListingCreditsService {
  constructor(
    @InjectRepository(FeaturedListingCreditEntity)
    private readonly credit_repository: Repository<FeaturedListingCreditEntity>,
  ) {}

  async addCredit(
    params: AddFeaturedListingCreditParams,
  ): Promise<FeaturedListingCreditEntity> {
    if (params.duration_days <= 0) {
      throw new BadRequestException(
        "La duración del cupón de destacado debe ser mayor que 0",
      );
    }

    if (params.stripe_checkout_session_id) {
      const existing = await this.credit_repository.findOne({
        where: {
          stripe_checkout_session_id: params.stripe_checkout_session_id,
        },
      });
      if (existing) {
        return existing;
      }
    }

    const credit = this.credit_repository.create({
      profile_id: params.profile_id,
      offer_id: params.offer_id ?? null,
      duration_days: params.duration_days,
      boost_weight: params.boost_weight,
      stripe_checkout_session_id: params.stripe_checkout_session_id ?? null,
      consumed_at: null,
    });

    return this.credit_repository.save(credit);
  }

  async countAvailable(profile_id: string): Promise<number> {
    return this.credit_repository.count({
      where: {
        profile_id,
        consumed_at: IsNull(),
      },
    });
  }

  async consumeOldest(
    profile_id: string,
  ): Promise<FeaturedListingCreditEntity | null> {
    const oldest = await this.credit_repository.findOne({
      where: {
        profile_id,
        consumed_at: IsNull(),
      },
      order: { created_at: "ASC" },
    });

    if (!oldest) {
      return null;
    }

    const preloaded = await this.credit_repository.preload({
      id: oldest.id,
      consumed_at: new Date(),
    });

    if (!preloaded) {
      return null;
    }

    return this.credit_repository.save(preloaded);
  }
}
