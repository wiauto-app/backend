import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { VehicleAiContextResolverService } from "./vehicle-ai-context-resolver.service";
import { VehicleAiPromptService } from "./vehicle-ai-prompt.service";
import { VehicleMarketStatsService } from "./vehicle-market-stats.service";
import {
  RecommendVehiclePriceDto,
  RecommendVehiclePriceResult,
} from "../dto/recommend-vehicle-price.dto";

@Injectable()
export class RecommendVehiclePriceService {
  constructor(
    private readonly context_resolver: VehicleAiContextResolverService,
    private readonly market_stats_service: VehicleMarketStatsService,
    private readonly prompt_service: VehicleAiPromptService,
  ) {}

  async execute(
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
