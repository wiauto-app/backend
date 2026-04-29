import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { FeatureRepository } from "../../../domain/repositories/feature.repository";
import { FindFeaturesUseCaseDto } from "./find-features.dto";
import { PrimitiveFeature } from "../../../domain/entities/features";

@Injectable()
export class FindFeaturesUseCase {
  constructor(private readonly featureRepository: FeatureRepository) {}

  async execute(findFeaturesDto: FindFeaturesUseCaseDto): Promise<{ features: PrimitiveFeature[] }> {
    const features = await this.featureRepository.findAll(findFeaturesDto);
    return { features: features.map((feature) => feature.toPrimitives()) };
  }
}