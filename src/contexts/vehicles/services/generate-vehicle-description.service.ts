import { BadRequestException } from "@nestjs/common";
import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { VehicleAiContextResolverService } from "./vehicle-ai-context-resolver.service";
import { VehicleAiPromptService } from "./vehicle-ai-prompt.service";
import {
  GenerateVehicleDescriptionDto,
  GenerateVehicleDescriptionResult,
} from "../dto/generate-vehicle-description.dto";

const REQUIRED_FIELDS = [
  "version_id",
  "condition",
  "mileage",
  "transmission_type",
  "power",
  "traction_id",
] as const;

@Injectable()
export class GenerateVehicleDescriptionService {
  constructor(
    private readonly context_resolver: VehicleAiContextResolverService,
    private readonly prompt_service: VehicleAiPromptService,
  ) {}

  async execute(
    dto: GenerateVehicleDescriptionDto,
  ): Promise<GenerateVehicleDescriptionResult> {
    this.validate_required_fields(dto);

    const labels = await this.context_resolver.resolve(dto);
    const description = await this.prompt_service.generateDescription(
      labels,
      dto.settings,
    );

    return { description };
  }

  private validate_required_fields(dto: GenerateVehicleDescriptionDto): void {
    const missing = REQUIRED_FIELDS.filter((field) => {
      const value = dto[field];
      if (field === "mileage" || field === "power" || field === "version_id") {
        return value === undefined || value === null;
      }
      return value === undefined || value === null || value === "";
    });

    if (missing.length > 0) {
      throw new BadRequestException(
        `Faltan campos obligatorios para generar la descripción: ${missing.join(", ")}`,
      );
    }
  }
}
