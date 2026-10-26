import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { ForbiddenException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";

import { TypeOrmDealershipMemberRepository } from "@/src/contexts/dealership/repositories/typeorm.dealership-member-repository";
import { ValidationException } from "@/src/contexts/shared/exceptions/validation.exception";
import { VehicleNotFoundException } from "@/src/contexts/vehicles/exceptions/vehicle-not-found.exception";
import { VehicleEntity } from "@/src/contexts/vehicles/entities/vehicle.entity";
import { STATUS_VEHICLE } from "@/src/contexts/vehicles/types/vehicle";
import { VehiclePriceEntity } from "@/src/contexts/vehicles/vehicle-prices/entities/vehicle-price.entity";
import { VEHICLE_PRICE_STATUS } from "@/src/contexts/vehicles/vehicle-prices/types/vehicle-price";

import { DEALERSHIP_FINANCING_LEGAL_NOTICE } from "../constants/dealership-financing.constants";
import { DEALERSHIP_FINANCING_SETTINGS_DEFAULTS } from "../constants/dealership-financing-settings.defaults";
import type { PatchDealershipFinancingSettingsHttpDto } from "../dto/patch-dealership-financing-settings.http-dto";
import type { QuoteVehicleFinancingHttpDto } from "../dto/quote-vehicle-financing.http-dto";
import { DealershipFinancingSettingsEntity } from "../entities/dealership-financing-settings.entity";
import type { DealershipFinancingSettingsResponse } from "../types/dealership-financing-settings-response";
import type {
  LeadFinancingSnapshot,
  VehicleFinancingOffer,
  VehicleFinancingOfferSummary,
  VehicleFinancingQuote,
} from "../types/vehicle-financing-offer";
import {
  calculateDealershipFinancing,
  type DealershipFinancingCalculationResult,
} from "../utils/dealership-financing-calculator";

/** Vehículo mínimo que el servicio sabe decorar con `financing_offer`. */
export interface FinancingDecoratableVehicle {
  price: number;
  offer_financing: boolean;
  dealership: { id: string } | null;
}

export interface VehicleFinancingQuoteResult {
  quote: VehicleFinancingQuote;
  snapshot: LeadFinancingSnapshot;
  vehicle: Pick<VehicleEntity, "id" | "dealership_id" | "profile_id">;
}

@Injectable()
export class DealershipFinancingService {
  constructor(
    @InjectRepository(DealershipFinancingSettingsEntity)
    private readonly settings_repository: Repository<DealershipFinancingSettingsEntity>,
    @InjectRepository(VehicleEntity)
    private readonly vehicle_repository: Repository<VehicleEntity>,
    @InjectRepository(VehiclePriceEntity)
    private readonly vehicle_price_repository: Repository<VehiclePriceEntity>,
    private readonly dealership_member_repository: TypeOrmDealershipMemberRepository,
  ) {}

  // ---------------------------------------------------------------------------
  // Condiciones del concesionario
  // ---------------------------------------------------------------------------

  async getForProfile(
    profile_id: string,
  ): Promise<DealershipFinancingSettingsResponse> {
    const dealership_id = await this.resolveDealershipIdOrFail(profile_id);
    const row = await this.settings_repository.findOne({
      where: { dealership_id },
    });
    return this.toResponse(dealership_id, row);
  }

  async patchForProfile(
    profile_id: string,
    dto: PatchDealershipFinancingSettingsHttpDto,
  ): Promise<DealershipFinancingSettingsResponse> {
    const dealership_id = await this.resolveDealershipIdOrFail(profile_id);
    const existing = await this.settings_repository.findOne({
      where: { dealership_id },
    });

    const patch = Object.fromEntries(
      Object.entries(dto).filter(([, value]) => value !== undefined),
    ) as Partial<DealershipFinancingSettingsEntity>;

    if (typeof patch.financial_entity === "string") {
      patch.financial_entity = patch.financial_entity.trim() || null;
    }
    if (typeof patch.other_conditions === "string") {
      patch.other_conditions = patch.other_conditions.trim() || null;
    }

    const merged = {
      ...DEALERSHIP_FINANCING_SETTINGS_DEFAULTS,
      ...existing,
      ...patch,
    };
    this.assertConsistent(merged);

    const preloaded = existing
      ? await this.settings_repository.preload({ id: existing.id, ...patch })
      : undefined;
    const saved = await this.settings_repository.save(
      preloaded ??
        this.settings_repository.create({ ...patch, dealership_id }),
    );

    const fresh = await this.settings_repository.findOne({
      where: { id: saved.id },
    });
    return this.toResponse(dealership_id, fresh);
  }

  /** Estado resumido para cualquier miembro (p. ej. toggle al publicar). */
  async getStatusForProfile(
    profile_id: string,
  ): Promise<{ enabled: boolean }> {
    const membership =
      await this.dealership_member_repository.findOneByProfileId(profile_id);
    return {
      enabled: await this.isEnabledForDealership(
        membership?.dealership_id ?? null,
      ),
    };
  }

  async isEnabledForDealership(dealership_id: string | null): Promise<boolean> {
    if (!dealership_id) {
      return false;
    }
    const row = await this.settings_repository.findOne({
      where: { dealership_id, enabled: true },
      select: { id: true },
    });
    return Boolean(row);
  }

  async findEnabledByDealershipIds(
    dealership_ids: string[],
  ): Promise<Map<string, DealershipFinancingSettingsEntity>> {
    const unique_ids = [...new Set(dealership_ids)];
    if (unique_ids.length === 0) {
      return new Map();
    }
    const rows = await this.settings_repository.find({
      where: { dealership_id: In(unique_ids), enabled: true },
    });
    return new Map(rows.map((row) => [row.dealership_id, row]));
  }

  // ---------------------------------------------------------------------------
  // Oferta en listados y ficha
  // ---------------------------------------------------------------------------

  async decorateWithSummary<T extends FinancingDecoratableVehicle>(
    items: T[],
  ): Promise<(T & { financing_offer: VehicleFinancingOfferSummary | null })[]> {
    const dealership_ids: string[] = [];
    for (const item of items) {
      if (item.offer_financing && item.dealership) {
        dealership_ids.push(item.dealership.id);
      }
    }
    const settings_by_dealership =
      await this.findEnabledByDealershipIds(dealership_ids);

    return items.map((item) => ({
      ...item,
      financing_offer: this.resolveSummary(item, settings_by_dealership),
    }));
  }

  async decorateWithOffer<T extends FinancingDecoratableVehicle>(
    item: T,
  ): Promise<T & { financing_offer: VehicleFinancingOffer | null }> {
    const dealership_id = item.dealership?.id;
    if (!item.offer_financing || !dealership_id) {
      return { ...item, financing_offer: null };
    }
    const settings_by_dealership = await this.findEnabledByDealershipIds([
      dealership_id,
    ]);
    const settings = settings_by_dealership.get(dealership_id);
    return {
      ...item,
      financing_offer: settings ? this.buildOffer(item.price, settings) : null,
    };
  }

  buildSummary(
    price: number,
    settings: DealershipFinancingSettingsEntity,
  ): VehicleFinancingOfferSummary | null {
    const result = this.calculateFrom(
      price,
      settings,
      settings.default_down_payment_percent,
      settings.max_term_months,
    );
    if (!result) {
      return null;
    }
    return {
      monthly_from: result.monthly_payment,
      down_payment_percent: result.down_payment_percent,
      term_months: result.term_months,
    };
  }

  buildOffer(
    price: number,
    settings: DealershipFinancingSettingsEntity,
  ): VehicleFinancingOffer | null {
    const summary = this.buildSummary(price, settings);
    if (!summary) {
      return null;
    }
    return {
      ...summary,
      financial_entity: settings.financial_entity,
      tin: settings.tin,
      declared_tae: settings.declared_tae,
      min_term_months: settings.min_term_months,
      max_term_months: settings.max_term_months,
      default_term_months: settings.default_term_months,
      default_down_payment_percent: settings.default_down_payment_percent,
      min_down_payment_percent: settings.min_down_payment_percent,
      max_down_payment_percent: settings.max_down_payment_percent,
      min_financeable_amount: settings.min_financeable_amount,
      opening_fee_percent: settings.opening_fee_percent,
      opening_fee_fixed: settings.opening_fee_fixed,
      other_conditions: settings.other_conditions,
      legal_notice: DEALERSHIP_FINANCING_LEGAL_NOTICE,
    };
  }

  // ---------------------------------------------------------------------------
  // Simulación por anuncio
  // ---------------------------------------------------------------------------

  async quoteForVehicle(
    vehicle_id: string,
    dto: QuoteVehicleFinancingHttpDto,
  ): Promise<VehicleFinancingQuote> {
    const { quote } = await this.resolveQuote(vehicle_id, dto);
    return quote;
  }

  /** Cálculo validado contra las condiciones vigentes del anuncio. */
  async resolveQuote(
    vehicle_id: string,
    dto: QuoteVehicleFinancingHttpDto,
  ): Promise<VehicleFinancingQuoteResult> {
    const vehicle = await this.vehicle_repository.findOne({
      where: { id: vehicle_id },
      select: {
        id: true,
        status: true,
        offer_financing: true,
        dealership_id: true,
        profile_id: true,
      },
    });
    if (!vehicle) {
      throw new VehicleNotFoundException(vehicle_id);
    }
    if (vehicle.status !== STATUS_VEHICLE.ACTIVE) {
      throw new ValidationException("El vehículo no está disponible");
    }
    if (!vehicle.offer_financing || !vehicle.dealership_id) {
      throw new ValidationException("Este anuncio no ofrece financiación");
    }

    const settings = await this.settings_repository.findOne({
      where: { dealership_id: vehicle.dealership_id, enabled: true },
    });
    if (!settings) {
      throw new ValidationException("Este anuncio no ofrece financiación");
    }

    const price_row = await this.vehicle_price_repository.findOne({
      where: { vehicle_id, status: VEHICLE_PRICE_STATUS.ACTIVE },
      order: { created_at: "DESC" },
    });
    const price = Number(price_row?.price ?? 0);

    if (
      dto.down_payment_percent < settings.min_down_payment_percent ||
      dto.down_payment_percent > settings.max_down_payment_percent
    ) {
      throw new ValidationException(
        `La entrada debe estar entre el ${settings.min_down_payment_percent} % y el ${settings.max_down_payment_percent} %`,
      );
    }
    if (
      dto.term_months < settings.min_term_months ||
      dto.term_months > settings.max_term_months
    ) {
      throw new ValidationException(
        `El plazo debe estar entre ${settings.min_term_months} y ${settings.max_term_months} meses`,
      );
    }

    const result = this.calculateFrom(
      price,
      settings,
      dto.down_payment_percent,
      dto.term_months,
    );
    if (!result) {
      throw new ValidationException(
        "El importe a financiar es inferior al mínimo del concesionario",
      );
    }

    return {
      quote: {
        vehicle_id,
        price: result.price,
        down_payment_percent: result.down_payment_percent,
        down_payment: result.down_payment,
        term_months: result.term_months,
        financeable_amount: result.financeable_amount,
        opening_fee: result.opening_fee,
        opening_fee_percent: settings.opening_fee_percent,
        opening_fee_fixed: settings.opening_fee_fixed,
        monthly_payment: result.monthly_payment,
        total_interest: result.total_interest,
        total_payable: result.total_payable,
        tin: settings.tin,
        declared_tae: settings.declared_tae,
        financial_entity: settings.financial_entity,
        other_conditions: settings.other_conditions,
        legal_notice: DEALERSHIP_FINANCING_LEGAL_NOTICE,
      },
      snapshot: {
        price: result.price,
        down_payment_percent: result.down_payment_percent,
        down_payment: result.down_payment,
        term_months: result.term_months,
        monthly_payment: result.monthly_payment,
        total_interest: result.total_interest,
        opening_fee: result.opening_fee,
        tin: settings.tin,
        declared_tae: settings.declared_tae,
        financial_entity: settings.financial_entity,
      },
      vehicle: {
        id: vehicle.id,
        dealership_id: vehicle.dealership_id,
        profile_id: vehicle.profile_id,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private resolveSummary(
    item: FinancingDecoratableVehicle,
    settings_by_dealership: Map<string, DealershipFinancingSettingsEntity>,
  ): VehicleFinancingOfferSummary | null {
    const dealership_id = item.dealership?.id;
    if (!item.offer_financing || !dealership_id) {
      return null;
    }
    const settings = settings_by_dealership.get(dealership_id);
    return settings ? this.buildSummary(item.price, settings) : null;
  }

  private calculateFrom(
    price: number,
    settings: DealershipFinancingSettingsEntity,
    down_payment_percent: number,
    term_months: number,
  ): DealershipFinancingCalculationResult | null {
    return calculateDealershipFinancing({
      price: Number(price),
      down_payment_percent,
      term_months,
      tin: settings.tin,
      opening_fee_percent: settings.opening_fee_percent,
      opening_fee_fixed: settings.opening_fee_fixed,
      min_financeable_amount: settings.min_financeable_amount,
    });
  }

  private async resolveDealershipIdOrFail(profile_id: string): Promise<string> {
    const membership =
      await this.dealership_member_repository.findOneByProfileId(profile_id);
    if (!membership) {
      throw new ForbiddenException("No perteneces a ningún concesionario");
    }
    return membership.dealership_id;
  }

  private assertConsistent(settings: {
    enabled: boolean;
    financial_entity: string | null;
    min_term_months: number;
    max_term_months: number;
    default_term_months: number;
    min_down_payment_percent: number;
    max_down_payment_percent: number;
    default_down_payment_percent: number;
  }): void {
    if (settings.enabled && !settings.financial_entity) {
      throw new ValidationException(
        "Indica la entidad financiera para activar la financiación",
      );
    }
    if (settings.min_term_months > settings.max_term_months) {
      throw new ValidationException(
        "El plazo mínimo no puede ser mayor que el máximo",
      );
    }
    if (
      settings.default_term_months < settings.min_term_months ||
      settings.default_term_months > settings.max_term_months
    ) {
      throw new ValidationException(
        "El plazo por defecto debe estar entre el mínimo y el máximo",
      );
    }
    if (settings.min_down_payment_percent > settings.max_down_payment_percent) {
      throw new ValidationException(
        "La entrada mínima no puede ser mayor que la máxima",
      );
    }
    if (
      settings.default_down_payment_percent < settings.min_down_payment_percent ||
      settings.default_down_payment_percent > settings.max_down_payment_percent
    ) {
      throw new ValidationException(
        "La entrada por defecto debe estar entre el mínimo y el máximo",
      );
    }
  }

  private toResponse(
    dealership_id: string,
    row: DealershipFinancingSettingsEntity | null,
  ): DealershipFinancingSettingsResponse {
    const base = row ?? DEALERSHIP_FINANCING_SETTINGS_DEFAULTS;
    return {
      dealership_id,
      configured: Boolean(row),
      enabled: base.enabled,
      financial_entity: base.financial_entity,
      tin: base.tin,
      declared_tae: base.declared_tae,
      min_term_months: base.min_term_months,
      max_term_months: base.max_term_months,
      default_term_months: base.default_term_months,
      default_down_payment_percent: base.default_down_payment_percent,
      min_down_payment_percent: base.min_down_payment_percent,
      max_down_payment_percent: base.max_down_payment_percent,
      min_financeable_amount: base.min_financeable_amount,
      opening_fee_percent: base.opening_fee_percent,
      opening_fee_fixed: base.opening_fee_fixed,
      other_conditions: base.other_conditions,
    };
  }
}
