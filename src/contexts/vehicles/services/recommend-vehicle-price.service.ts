import { Inject } from "@nestjs/common";
import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";

import { VehicleAiContextResolverService } from "./vehicle-ai-context-resolver.service";
import { VehicleAiPromptService } from "./vehicle-ai-prompt.service";
import { VehicleMarketStatsService } from "./vehicle-market-stats.service";
import {
  RecommendVehiclePriceDto,
  RecommendVehiclePriceResult,
} from "../dto/recommend-vehicle-price.dto";

/** Una recomendación por usuario + versión cada hora (también sirve el resultado cacheado). */
const PRICE_RECOMMENDATION_TTL_MS = 60 * 60 * 1000;

@Injectable()
export class RecommendVehiclePriceService {
  constructor(
    private readonly context_resolver: VehicleAiContextResolverService,
    private readonly market_stats_service: VehicleMarketStatsService,
    private readonly prompt_service: VehicleAiPromptService,
    @Inject(CACHE_MANAGER) private readonly cache_manager: Cache,
  ) {}

  async execute(
    dto: RecommendVehiclePriceDto,
    userId: string,
  ): Promise<RecommendVehiclePriceResult> {
    const cacheKey = this.cache_key(userId, dto.version_id);
    const cached =
      await this.cache_manager.get<RecommendVehiclePriceResult>(cacheKey);

    if (cached) {
      return cached;
    }

    const result = await this.compute_recommendation(dto);
    await this.cache_manager.set(cacheKey, result, PRICE_RECOMMENDATION_TTL_MS);

    return result;
  }

  private cache_key(userId: string, versionId: number): string {
    return `vehicle-price-recommendation:${userId}:${versionId}`;
  }

  private async compute_recommendation(
    dto: RecommendVehiclePriceDto,
  ): Promise<RecommendVehiclePriceResult> {
    const [labels, stats] = await Promise.all([
      this.context_resolver.resolve(dto),
      this.market_stats_service.compute(dto),
    ]);

    if (stats && stats.sample_count >= 3) {
      const explanation = await this.prompt_service.generatePriceExplanation(
        labels,
        stats,
      );

      return {
        recommended_price: stats.recommended_price,
        range_min: stats.range_min,
        range_max: stats.range_max,
        sample_count: stats.sample_count,
        confidence: stats.confidence,
        explanation,
        source: "platform",
      };
    }

    const ai_recommendation =
      await this.prompt_service.generateAiPriceRecommendation(labels);

    return {
      recommended_price: ai_recommendation.recommended_price,
      range_min: ai_recommendation.range_min,
      range_max: ai_recommendation.range_max,
      sample_count: 0,
      confidence: "low",
      explanation: ai_recommendation.explanation,
      source: "ai",
    };
  }
}
