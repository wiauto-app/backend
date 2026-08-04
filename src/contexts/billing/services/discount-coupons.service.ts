import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ILike, Repository } from "typeorm";

import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { PaginatedResult } from "@/src/contexts/shared/types/paginated-result.vo";
import { getSkip } from "@/src/contexts/shared/getSkip";
import { StripeClient } from "../clients/stripe.client";
import { DiscountCouponEntity } from "../entities/discount-coupon.entity";
import { CreateDiscountCouponHttpDto } from "../api/admin/discount-coupons/create-discount-coupon.http-dto";
import { UpdateDiscountCouponHttpDto } from "../api/admin/discount-coupons/update-discount-coupon.http-dto";

const generate_code = (): string => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "WA-";
  for (let index = 0; index < 8; index += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
};

@Injectable()
export class DiscountCouponsService {
  constructor(
    @InjectRepository(DiscountCouponEntity)
    private readonly coupon_repository: Repository<DiscountCouponEntity>,
    private readonly stripe_client: StripeClient,
  ) {}

  async create(dto: CreateDiscountCouponHttpDto): Promise<DiscountCouponEntity> {
    const has_percent = typeof dto.percent_off === "number";
    const has_amount = typeof dto.amount_off_cents === "number";

    if (has_percent === has_amount) {
      throw new BadRequestException(
        "Debes indicar percent_off o amount_off_cents, no ambos",
      );
    }

    const code = (dto.code ?? generate_code()).trim().toUpperCase();
    const existing = await this.coupon_repository.findOne({ where: { code } });
    if (existing) {
      throw new ConflictException("Ya existe un cupón con ese código");
    }

    const expires_at = dto.expires_at ? new Date(dto.expires_at) : null;
    if (expires_at && Number.isNaN(expires_at.getTime())) {
      throw new BadRequestException("expires_at no es una fecha válida");
    }

    const stripe_coupon_id = await this.stripe_client.createCoupon({
      name: dto.name,
      percent_off: has_percent ? dto.percent_off : null,
      amount_off_cents: has_amount ? dto.amount_off_cents : null,
      currency: dto.currency ?? "eur",
      duration: "once",
    });

    const promotion = await this.stripe_client.createPromotionCode({
      coupon_id: stripe_coupon_id,
      code,
      max_redemptions: dto.max_redemptions ?? 1,
      expires_at,
      active: dto.active ?? true,
    });

    const saved = await this.coupon_repository.save({
      code,
      name: dto.name,
      percent_off: has_percent ? dto.percent_off! : null,
      amount_off_cents: has_amount ? dto.amount_off_cents! : null,
      currency: has_amount ? (dto.currency ?? "eur").toLowerCase() : null,
      stripe_coupon_id,
      stripe_promotion_code_id: promotion.id,
      max_redemptions: dto.max_redemptions ?? 1,
      times_redeemed: promotion.times_redeemed,
      active: dto.active ?? true,
      expires_at,
    });

    return saved;
  }

  async findAll(params: {
    page: number;
    limit: number;
    search?: string;
  }): Promise<PaginatedResult<DiscountCouponEntity>> {
    const skip = getSkip(params.page, params.limit);
    const where = params.search
      ? [
          { code: ILike(`%${params.search}%`) },
          { name: ILike(`%${params.search}%`) },
        ]
      : undefined;

    const [rows, total] = await this.coupon_repository.findAndCount({
      where,
      order: { created_at: "DESC" },
      skip,
      take: params.limit,
    });

    const synced = await Promise.all(
      rows.map((row) => this.syncTimesRedeemed(row)),
    );

    return new PaginatedResult(synced, total, params.page, params.limit);
  }

  async findOne(id: string): Promise<DiscountCouponEntity> {
    const coupon = await this.coupon_repository.findOne({ where: { id } });
    if (!coupon) {
      throw new NotFoundException("Cupón no encontrado");
    }

    return this.syncTimesRedeemed(coupon);
  }

  async update(
    id: string,
    dto: UpdateDiscountCouponHttpDto,
  ): Promise<DiscountCouponEntity> {
    const coupon = await this.findOne(id);

    if (dto.active !== undefined) {
      const stripe = await this.stripe_client.updatePromotionCode(
        coupon.stripe_promotion_code_id,
        { active: dto.active },
      );

      const preloaded = await this.coupon_repository.preload({
        id: coupon.id,
        active: stripe.active,
        times_redeemed: stripe.times_redeemed,
      });

      if (!preloaded) {
        throw new NotFoundException("Cupón no encontrado");
      }

      return this.coupon_repository.save(preloaded);
    }

    return coupon;
  }

  async remove(id: string): Promise<void> {
    const coupon = await this.findOne(id);

    try {
      await this.stripe_client.updatePromotionCode(
        coupon.stripe_promotion_code_id,
        { active: false },
      );
    } catch {
      // El promotion code puede ya estar inactivo.
    }

    try {
      await this.stripe_client.deleteCoupon(coupon.stripe_coupon_id);
    } catch {
      // Stripe no siempre permite borrar cupones ya usados.
    }

    await this.coupon_repository.delete(id);
  }

  private async syncTimesRedeemed(
    coupon: DiscountCouponEntity,
  ): Promise<DiscountCouponEntity> {
    try {
      const stripe = await this.stripe_client.retrievePromotionCode(
        coupon.stripe_promotion_code_id,
      );

      if (
        stripe.times_redeemed === coupon.times_redeemed &&
        stripe.active === coupon.active
      ) {
        return coupon;
      }

      const preloaded = await this.coupon_repository.preload({
        id: coupon.id,
        times_redeemed: stripe.times_redeemed,
        active: stripe.active,
      });

      if (!preloaded) {
        return coupon;
      }

      return this.coupon_repository.save(preloaded);
    } catch {
      return coupon;
    }
  }
}
