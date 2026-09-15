import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
} from "@nestjs/common";
import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";

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

/** Tiempo mínimo entre generaciones de descripción por usuario. */
export const DESCRIPTION_RATE_LIMIT_COOLDOWN_MS = 10_000;

@Injectable()
export class GenerateVehicleDescriptionService {
  constructor(
    private readonly context_resolver: VehicleAiContextResolverService,
    private readonly prompt_service: VehicleAiPromptService,
    @Inject(CACHE_MANAGER) private readonly cache_manager: Cache,
  ) {}

  async execute(
    dto: GenerateVehicleDescriptionDto,
    userId: string,
  ): Promise<GenerateVehicleDescriptionResult> {
    await this.assertWithinRateLimit(userId);

    this.validateRequiredFields(dto);

    const labels = await this.context_resolver.resolve(dto);
    const description = await this.prompt_service.generateDescription(
      labels,
      dto.settings,
    );

    await this.markRateLimit(userId);

    return { description };
  }

  private async assertWithinRateLimit(userId: string): Promise<void> {
    const cacheKey = this.rateLimitKey(userId);
    const raw = await this.cache_manager.get<unknown>(cacheKey);
    const lastGeneratedAt = this.parseTimestamp(raw);

    if (lastGeneratedAt == null) {
      if (raw != null) {
        await this.cache_manager.del(cacheKey);
      }
      return;
    }

    const elapsedMs = Date.now() - lastGeneratedAt;
    if (elapsedMs >= DESCRIPTION_RATE_LIMIT_COOLDOWN_MS) {
      await this.cache_manager.del(cacheKey);
      return;
    }

    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((DESCRIPTION_RATE_LIMIT_COOLDOWN_MS - elapsedMs) / 1000),
    );

    throw new HttpException(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message: `Debes esperar ${retryAfterSeconds} s antes de generar otra descripción.`,
        retryAfter: retryAfterSeconds,
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }

  private async markRateLimit(userId: string): Promise<void> {
    await this.cache_manager.set(
      this.rateLimitKey(userId),
      Date.now(),
      DESCRIPTION_RATE_LIMIT_COOLDOWN_MS,
    );
  }

  /** Clave nueva: evita entradas antiguas `{ count, started_at }` en Redis. */
  private rateLimitKey(userId: string): string {
    return `vehicle-description-cooldown-v2:${userId}`;
  }

  private parseTimestamp(raw: unknown): number | null {
    if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) {
      return raw;
    }

    if (typeof raw === "string" && raw.trim()) {
      const parsed = Number(raw);
      if (Number.isFinite(parsed) && parsed > 0) {
        return parsed;
      }
    }

    return null;
  }

  private validateRequiredFields(dto: GenerateVehicleDescriptionDto): void {
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
