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
import { AssistantCreditPackEntity } from "../entities/assistant-credit-pack.entity";
import { CreateAssistantCreditPackHttpDto } from "../api/admin/assistant-credit-packs/create-assistant-credit-pack.http-dto";
import { UpdateAssistantCreditPackHttpDto } from "../api/admin/assistant-credit-packs/update-assistant-credit-pack.http-dto";
import { ONE_TIME_PRODUCT_KIND } from "../types/billing.enums";

@Injectable()
export class AssistantCreditPacksService {
  constructor(
    @InjectRepository(AssistantCreditPackEntity)
    private readonly pack_repository: Repository<AssistantCreditPackEntity>,
    private readonly stripe_client: StripeClient,
  ) {}

  async create(
    dto: CreateAssistantCreditPackHttpDto,
  ): Promise<AssistantCreditPackEntity> {
    const saved = await this.pack_repository.save({
      title: dto.title,
      description: dto.description ?? null,
      credits_quantity: dto.credits_quantity,
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
  }): Promise<PaginatedResult<AssistantCreditPackEntity>> {
    const skip = getSkip(params.page, params.limit);
    const where = params.search
      ? { title: ILike(`%${params.search}%`) }
      : undefined;

    const [rows, total] = await this.pack_repository.findAndCount({
      where,
      order: { sort_order: "ASC", created_at: "DESC" },
      skip,
      take: params.limit,
    });

    return new PaginatedResult(rows, total, params.page, params.limit);
  }

  async findOne(id: string): Promise<AssistantCreditPackEntity> {
    const pack = await this.pack_repository.findOne({ where: { id } });
    if (!pack) {
      throw new NotFoundException("Pack de consultas no encontrado");
    }
    return pack;
  }

  async findCatalog(): Promise<AssistantCreditPackEntity[]> {
    return this.pack_repository.find({
      where: { is_active: true },
      order: { sort_order: "ASC", credits_quantity: "ASC" },
    });
  }

  async update(
    id: string,
    dto: UpdateAssistantCreditPackHttpDto,
  ): Promise<AssistantCreditPackEntity> {
    await this.findOne(id);

    const preloaded = await this.pack_repository.preload({
      id,
      ...(dto.title !== undefined ? { title: dto.title } : {}),
      ...(dto.description !== undefined
        ? { description: dto.description }
        : {}),
      ...(dto.credits_quantity !== undefined
        ? { credits_quantity: dto.credits_quantity }
        : {}),
      ...(dto.amount_cents !== undefined
        ? { amount_cents: dto.amount_cents }
        : {}),
      ...(dto.currency !== undefined
        ? { currency: dto.currency.toLowerCase() }
        : {}),
      ...(dto.is_active !== undefined ? { is_active: dto.is_active } : {}),
      ...(dto.sort_order !== undefined ? { sort_order: dto.sort_order } : {}),
    });

    if (!preloaded) {
      throw new NotFoundException("Pack de consultas no encontrado");
    }

    await this.pack_repository.save(preloaded);
    return this.syncStripe(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.pack_repository.delete(id);
  }

  async syncStripe(id: string): Promise<AssistantCreditPackEntity> {
    const pack = await this.findOne(id);
    const title = pack.title?.trim();

    if (!title) {
      throw new BadRequestException("El título es obligatorio");
    }

    if (pack.amount_cents <= 0) {
      throw new BadRequestException("El importe debe ser mayor que 0");
    }

    const stripe_product_id =
      await this.stripe_client.createOrUpdateOneTimeProduct({
        stripe_product_id: pack.stripe_product_id,
        title,
        description: pack.description,
        is_active: pack.is_active,
        metadata: {
          product_kind: ONE_TIME_PRODUCT_KIND.ASSISTANT_CREDIT_PACK,
          product_id: pack.id,
          credits_quantity: String(pack.credits_quantity),
        },
      });

    const stripe_price_id =
      await this.stripe_client.createOrUpdateOneTimePrice({
        stripe_product_id,
        stripe_price_id: pack.stripe_price_id,
        amount_cents: pack.amount_cents,
        currency: pack.currency,
      });

    const preloaded = await this.pack_repository.preload({
      id: pack.id,
      stripe_product_id,
      stripe_price_id,
    });

    if (!preloaded) {
      throw new NotFoundException("Pack de consultas no encontrado");
    }

    return this.pack_repository.save(preloaded);
  }
}
