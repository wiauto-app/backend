import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { FeatureRepository } from "../../../domain/repositories/feature.repository";
import { RemoveFeatureDto } from "./remove-feature.dto";

@Injectable()
export class RemoveFeatureUseCase {
  constructor(private readonly featureRepository: FeatureRepository) {}

  async execute(removeFeatureDto: RemoveFeatureDto): Promise<void> {
    await this.featureRepository.remove(removeFeatureDto.id);
  }
}