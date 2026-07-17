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

const DESCRIPTION_CACHE_TTL_MS = 60 * 60 * 24 * 1000;
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_TTL_MS = 60 * 60 * 1000;

interface DescriptionRateBucket {
  count: number;
  started_at: number;
}

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
    const cacheKey = `vehicle-description:${userId}:${dto.version_id}`;
    const cachedDescription =
      await this.cache_manager.get<GenerateVehicleDescriptionResult | string>(
        cacheKey,
      );

    if (cachedDescription) {
      if (typeof cachedDescription === "string") {
        return { description: cachedDescription };
      }
      return cachedDescription;
    }

    await this.assert_within_rate_limit(userId);

    this.validate_required_fields(dto);

    const labels = await this.context_resolver.resolve(dto);
    const description = await this.prompt_service.generateDescription(
      labels,
      dto.settings,
    );
    const result: GenerateVehicleDescriptionResult = { description };

    await this.cache_manager.set(cacheKey, result, DESCRIPTION_CACHE_TTL_MS);
    await this.increment_rate_limit(userId);

    return result;
  }

  private async assert_within_rate_limit(userId: string): Promise<void> {
    const bucket = await this.get_rate_bucket(userId);
    if (!bucket) {
      return;
    }

    if (bucket.count >= RATE_LIMIT_MAX) {
      const retry_after_seconds = Math.max(
        1,
        Math.ceil(
          (RATE_LIMIT_TTL_MS - (Date.now() - bucket.started_at)) / 1000,
        ),
      );

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message:
            "Has alcanzado el límite de 3 generaciones de descripción por hora. Inténtalo más tarde.",
          retryAfter: retry_after_seconds,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private async increment_rate_limit(userId: string): Promise<void> {
    const rateKey = this.rate_limit_key(userId);
    const now = Date.now();
    const bucket = await this.get_rate_bucket(userId);

    if (!bucket) {
      await this.cache_manager.set(
        rateKey,
        { count: 1, started_at: now } satisfies DescriptionRateBucket,
        RATE_LIMIT_TTL_MS,
      );
      return;
    }

    const remaining_ttl = Math.max(
      1,
      RATE_LIMIT_TTL_MS - (now - bucket.started_at),
    );

    await this.cache_manager.set(
      rateKey,
      {
        count: bucket.count + 1,
        started_at: bucket.started_at,
      } satisfies DescriptionRateBucket,
      remaining_ttl,
    );
  }

  private async get_rate_bucket(
    userId: string,
  ): Promise<DescriptionRateBucket | null> {
    const rateKey = this.rate_limit_key(userId);
    const bucket =
      await this.cache_manager.get<DescriptionRateBucket>(rateKey);

    if (!bucket) {
      return null;
    }

    if (Date.now() - bucket.started_at >= RATE_LIMIT_TTL_MS) {
      await this.cache_manager.del(rateKey);
      return null;
    }

    return bucket;
  }

  private rate_limit_key(userId: string): string {
    return `vehicle-description-rate:${userId}`;
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
