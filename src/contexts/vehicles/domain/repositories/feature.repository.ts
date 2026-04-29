import { FindFeaturesUseCaseDto } from "../../application/features/find-features-use-case/find-features.dto";
import { Feature } from "../entities/features";


export abstract class FeatureRepository {
  abstract findOne(id: string): Promise<Feature | null>;
  abstract findAll(findFeaturesDto: FindFeaturesUseCaseDto): Promise<Feature[]>;
  abstract save(feature: Feature): Promise<void>;
  abstract persist_updated(feature: Feature): Promise<void>;
  abstract remove(id: string): Promise<void>;
}