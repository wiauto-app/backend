import { VehicleAiContextDto } from "./vehicle-ai-context.dto";

export interface GenerateVehicleDescriptionDto extends VehicleAiContextDto {}

export interface GenerateVehicleDescriptionResult {
  description: string;
}
