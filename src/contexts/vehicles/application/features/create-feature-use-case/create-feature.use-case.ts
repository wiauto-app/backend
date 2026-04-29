import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { Feature, PrimitiveFeature } from "../../../domain/entities/features";
import { FeatureRepository } from "../../../domain/repositories/feature.repository";
import { CreateFeatureDto } from "./create-feature.dto";

@Injectable()
export class CreateFeatureUseCase {
  constructor(private readonly featureRepository: FeatureRepository) {}

  async execute(createFeatureDto: CreateFeatureDto): Promise<PrimitiveFeature> {
    const feature = Feature.create(createFeatureDto);
    await this.featureRepository.save(feature);
    return feature.toPrimitives();
  }
}