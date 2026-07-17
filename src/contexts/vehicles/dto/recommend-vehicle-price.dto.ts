import { VehicleAiContextDto } from "./vehicle-ai-context.dto";
import { VehicleMarketConfidence } from "../services/vehicle-market-stats.service";

export interface RecommendVehiclePriceDto extends VehicleAiContextDto {}

export type RecommendVehiclePriceSource = "platform" | "ai";

export interface RecommendVehiclePriceResult {
  recommended_price: number;
  range_min: number;
  range_max: number;
  sample_count: number;
  explanation: string;
  confidence: VehicleMarketConfidence;
  source: RecommendVehiclePriceSource;
}
