import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { PrimitiveFeature } from "../../../domain/entities/features";
import { FeatureNotFoundException } from "../../../domain/exceptions/feature-not-found.exception";
import { FeatureRepository } from "../../../domain/repositories/feature.repository";
import { FindFeatureDto } from "./find-feature.dto";

@Injectable()
export class FindFeatureUseCase {
  constructor(private readonly featureRepository: FeatureRepository) {}

  async execute(findFeatureDto: FindFeatureDto): Promise<{ feature: PrimitiveFeature }> {
    const feature = await this.featureRepository.findOne(findFeatureDto.id); 
    if (!feature) {
      throw new FeatureNotFoundException(findFeatureDto.id);
    }
    return { feature: feature.toPrimitives() };
  }
}