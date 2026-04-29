import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { FeatureRepository } from "../../../domain/repositories/feature.repository";
import { UpdateFeatureDto } from "./update-feature.dto";
import { FeatureNotFoundException } from "../../../domain/exceptions/feature-not-found.exception";
import { PrimitiveFeature } from "../../../domain/entities/features";

@Injectable()
export class UpdateFeatureUseCase {
  constructor(private readonly feature_repository: FeatureRepository) {}

  async execute(
    update_feature_dto: UpdateFeatureDto,
  ): Promise<{ feature: PrimitiveFeature }> {
    const feature = await this.feature_repository.findOne(update_feature_dto.id);
    if (!feature) {
      throw new FeatureNotFoundException(update_feature_dto.id);
    }
    const updated = feature.update({ name: update_feature_dto.name });
    await this.feature_repository.persist_updated(updated);
    return { feature: updated.toPrimitives() };
  }
}