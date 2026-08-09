import {
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ILike, Repository } from "typeorm";

import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { PaginatedResult } from "@/src/contexts/shared/types/paginated-result.vo";
import { getSkip } from "@/src/contexts/shared/getSkip";
import { StripeClient } from "../clients/stripe.client";
import { FeaturedListingOfferEntity } from "../entities/featured-listing-offer.entity";
import { CreateFeaturedListingOfferHttpDto } from "../api/admin/featured-listing-offers/create-featured-listing-offer.http-dto";
import { UpdateFeaturedListingOfferHttpDto } from "../api/admin/featured-listing-offers/update-featured-listing-offer.http-dto";
import { ONE_TIME_PRODUCT_KIND } from "../types/billing.enums";

@Injectable()
export class FeaturedListingOffersService {
  constructor(
    @InjectRepository(FeaturedListingOfferEntity)
    private readonly offer_repository: Repository<FeaturedListingOfferEntity>,
    private readonly stripe_client: StripeClient,
  ) {}

  async create(
    dto: CreateFeaturedListingOfferHttpDto,
  ): Promise<FeaturedListingOfferEntity> {
    const saved = await this.offer_repository.save({
      title: dto.title,
      description: dto.description ?? null,
      duration_days: dto.duration_days,
      boost_weight: dto.boost_weight,
      amount_cents: dto.amount_cents,
      currency: (dto.currency ?? "eur").toLowerCase(),
      is_active: dto.is_active ?? true,
      sort_order: dto.sort_order ?? 0,
      stripe_product_id: null,
      stripe_price_id: null,
    });

    return this.syncStripe(saved.id);
  }

  async findAll(params: {
    page: number;
    limit: number;
    search?: string;
  }): Promise<PaginatedResult<FeaturedListingOfferEntity>> {
    const skip = getSkip(params.page, params.limit);
    const where = params.search
      ? { title: ILike(`%${params.search}%`) }
      : undefined;

    const [rows, total] = await this.offer_repository.findAndCount({
      where,
      order: { sort_order: "ASC", created_at: "DESC" },
      skip,
      take: params.limit,
    });

    return new PaginatedResult(rows, total, params.page, params.limit);
  }

  async findOne(id: string): Promise<FeaturedListingOfferEntity> {
    const offer = await this.offer_repository.findOne({ where: { id } });
    if (!offer) {
      throw new NotFoundException("Oferta de destacar no encontrada");
    }
    return offer;
  }

  async findCatalog(): Promise<FeaturedListingOfferEntity[]> {
    return this.offer_repository.find({
      where: { is_active: true },
      order: { sort_order: "ASC", duration_days: "ASC" },
    });
  }

  async update(
    id: string,
    dto: UpdateFeaturedListingOfferHttpDto,
  ): Promise<FeaturedListingOfferEntity> {
    await this.findOne(id);

    const preloaded = await this.offer_repository.preload({
      id,
      ...dto,
    });

    if (!preloaded) {
      throw new NotFoundException("Oferta de destacar no encontrada");
    }

    await this.offer_repository.save(preloaded);
    return this.syncStripe(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.offer_repository.delete(id);
  }

  async syncStripe(id: string): Promise<FeaturedListingOfferEntity> {
    const offer = await this.findOne(id);
    const title = offer.title.trim();

    if (!title) {
      throw new BadRequestException("El título es obligatorio");
    }

    if (offer.amount_cents <= 0) {
      throw new BadRequestException("El importe debe ser mayor que 0");
    }

    const stripe_product_id =
      await this.stripe_client.createOrUpdateOneTimeProduct({
        stripe_product_id: offer.stripe_product_id,
        title,
        description: offer.description,
        is_active: offer.is_active,
        metadata: {
          product_kind: ONE_TIME_PRODUCT_KIND.FEATURED_LISTING_OFFER,
          product_id: offer.id,
          duration_days: String(offer.duration_days),
          boost_weight: String(offer.boost_weight),
        },
      });

    const stripe_price_id =
      await this.stripe_client.createOrUpdateOneTimePrice({
        stripe_product_id,
        stripe_price_id: offer.stripe_price_id,
        amount_cents: offer.amount_cents,
        currency: offer.currency,
      });

    const preloaded = await this.offer_repository.preload({
      id: offer.id,
      stripe_product_id,
      stripe_price_id,
    });

    if (!preloaded) {
      throw new NotFoundException("Oferta de destacar no encontrada");
    }

    return this.offer_repository.save(preloaded);
  }
}
