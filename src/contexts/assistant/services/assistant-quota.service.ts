import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { envs } from "@/src/common/envs";
import { ProfileEntity } from "@/src/contexts/profiles/entities/profile.entity";
import { EntitlementsService } from "@/src/contexts/billing/services/entitlements.service";
import { ENTITLEMENT_FEATURE } from "@/src/contexts/billing/types/entitlement-features";
import { AssistantQuotaExceededException } from "../exceptions/assistant-quota-exceeded.exception";
import type { AssistantQuotaBalance } from "../types/assistant-quota";

const getCurrentMonthStart = (reference = new Date()): Date =>
  new Date(reference.getFullYear(), reference.getMonth(), 1);

const isSameMonth = (left: Date, right: Date): boolean =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth();

@Injectable()
export class AssistantQuotaService {
  constructor(
    @InjectRepository(ProfileEntity)
    private readonly profileRepository: Repository<ProfileEntity>,
    @Inject(forwardRef(() => EntitlementsService))
    private readonly entitlements_service: EntitlementsService,
  ) {}

  private async findProfileOrThrow(profileId: string): Promise<ProfileEntity> {
    const profile = await this.profileRepository.findOne({
      where: { id: profileId },
    });

    if (!profile) {
      throw new NotFoundException("Perfil no encontrado");
    }

    return profile;
  }

  private resolveBalance(profile: ProfileEntity): AssistantQuotaBalance {
    const monthlyFreeLimit = envs.ASSISTANT_MONTHLY_FREE_QUOTA;
    const now = new Date();
    const periodStart = profile.assistant_quota_period_start;
    const monthlyFreeUsed =
      periodStart && isSameMonth(periodStart, now)
        ? profile.assistant_monthly_free_used
        : 0;
    const monthlyFreeRemaining = Math.max(
      monthlyFreeLimit - monthlyFreeUsed,
      0,
    );
    const purchasedCredits = profile.assistant_purchased_credits ?? 0;

    return {
      monthlyFreeLimit,
      monthlyFreeRemaining,
      purchasedCredits,
      totalRemaining: monthlyFreeRemaining + purchasedCredits,
    };
  }

  private async resetMonthlyQuotaIfNeeded(
    profile: ProfileEntity,
  ): Promise<ProfileEntity> {
    const now = new Date();
    const periodStart = profile.assistant_quota_period_start;

    if (periodStart && isSameMonth(periodStart, now)) {
      return profile;
    }

    const preloaded = await this.profileRepository.preload({
      id: profile.id,
      assistant_monthly_free_used: 0,
      assistant_quota_period_start: getCurrentMonthStart(now),
    });

    if (!preloaded) {
      throw new NotFoundException("Perfil no encontrado");
    }

    return this.profileRepository.save(preloaded);
  }

  private async getPlanAiRemaining(profileId: string): Promise<{
    unlimited: boolean;
    remaining: number;
  }> {
    const check = await this.entitlements_service.checkUsage(
      profileId,
      ENTITLEMENT_FEATURE.AI_REQUESTS,
    );
    if (check.limit === null) {
      return { unlimited: true, remaining: Number.MAX_SAFE_INTEGER };
    }
    return { unlimited: false, remaining: check.remaining ?? 0 };
  }

  async getBalance(profileId: string): Promise<AssistantQuotaBalance> {
    const profile = await this.findProfileOrThrow(profileId);
    const normalized = await this.resetMonthlyQuotaIfNeeded(profile);
    const balance = this.resolveBalance(normalized);
    const plan = await this.getPlanAiRemaining(profileId);

    if (plan.unlimited) {
      return {
        ...balance,
        totalRemaining: Number.MAX_SAFE_INTEGER,
      };
    }

    if (plan.remaining > 0) {
      return {
        ...balance,
        totalRemaining: balance.totalRemaining + plan.remaining,
      };
    }

    return balance;
  }

  async assertCanConsume(profileId: string): Promise<void> {
    const plan = await this.getPlanAiRemaining(profileId);
    if (plan.unlimited || plan.remaining > 0) {
      return;
    }

    const profile = await this.findProfileOrThrow(profileId);
    const normalized = await this.resetMonthlyQuotaIfNeeded(profile);
    const balance = this.resolveBalance(normalized);
    if (balance.totalRemaining <= 0) {
      throw new AssistantQuotaExceededException();
    }
  }

  async consume(profileId: string): Promise<AssistantQuotaBalance> {
    const plan = await this.getPlanAiRemaining(profileId);
    if (plan.unlimited || plan.remaining > 0) {
      await this.entitlements_service.incrementMeteredUsage(
        profileId,
        ENTITLEMENT_FEATURE.AI_REQUESTS,
      );
      return this.getBalance(profileId);
    }

    const profile = await this.findProfileOrThrow(profileId);
    const normalized = await this.resetMonthlyQuotaIfNeeded(profile);
    const balance = this.resolveBalance(normalized);

    if (balance.totalRemaining <= 0) {
      throw new AssistantQuotaExceededException();
    }

    const monthlyFreeLimit = envs.ASSISTANT_MONTHLY_FREE_QUOTA;
    const usesFreeQuota = balance.monthlyFreeRemaining > 0;

    const preloaded = await this.profileRepository.preload({
      id: normalized.id,
      assistant_quota_period_start:
        normalized.assistant_quota_period_start ?? getCurrentMonthStart(),
      assistant_monthly_free_used: usesFreeQuota
        ? normalized.assistant_monthly_free_used + 1
        : normalized.assistant_monthly_free_used,
      assistant_purchased_credits: usesFreeQuota
        ? normalized.assistant_purchased_credits
        : normalized.assistant_purchased_credits - 1,
    });

    if (!preloaded) {
      throw new NotFoundException("Perfil no encontrado");
    }

    if (!usesFreeQuota && preloaded.assistant_purchased_credits < 0) {
      throw new AssistantQuotaExceededException();
    }

    const saved = await this.profileRepository.save(preloaded);

    return {
      monthlyFreeLimit,
      monthlyFreeRemaining: Math.max(
        monthlyFreeLimit - saved.assistant_monthly_free_used,
        0,
      ),
      purchasedCredits: saved.assistant_purchased_credits,
      totalRemaining:
        Math.max(monthlyFreeLimit - saved.assistant_monthly_free_used, 0) +
        saved.assistant_purchased_credits,
    };
  }

  async addPurchasedCredits(
    profileId: string,
    amount: number,
  ): Promise<AssistantQuotaBalance> {
    if (amount <= 0) {
      throw new BadRequestException("La cantidad de créditos debe ser mayor a 0");
    }

    const profile = await this.findProfileOrThrow(profileId);

    const preloaded = await this.profileRepository.preload({
      id: profile.id,
      assistant_purchased_credits: profile.assistant_purchased_credits + amount,
    });

    if (!preloaded) {
      throw new NotFoundException("Perfil no encontrado");
    }

    const saved = await this.profileRepository.save(preloaded);
    return this.resolveBalance(saved);
  }
}
