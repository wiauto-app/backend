import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { Feature } from "../../domain/entities/features";
import { FindFeaturesUseCaseDto } from "../../application/features/find-features-use-case/find-features.dto";
import { FeatureRepository } from "../../domain/repositories/feature.repository";
import { FeaturesEntity } from "../persistence/features.entity";
import { getPaginationProps } from "@/src/contexts/shared/dto/getPaginationProps";
import { FeatureNotFoundException } from "../../domain/exceptions/feature-not-found.exception";

export class TypeOrmFeatureRepository extends FeatureRepository {
  constructor(
    @InjectRepository(FeaturesEntity)
    private readonly featureRepository: Repository<FeaturesEntity>,
  ) {
    super();
  }

  private feature_row_to_domain(row: FeaturesEntity): Feature {
    return Feature.fromPrimitives({
      id: row.id,
      name: row.name,
      slug: row.slug,
      created_at: row.created_at,
      updated_at: row.updated_at,
    });
  }

  async findOne(id: string): Promise<Feature | null> {
    const row = await this.featureRepository.findOne({ where: { id } });
    if (!row) {
      return null;
    }
    return this.feature_row_to_domain(row);
  }

  async findAll(find_features_dto: FindFeaturesUseCaseDto): Promise<Feature[]> {
    const { skip, take, order_column, direction } = getPaginationProps(find_features_dto);
    const rows = await this.featureRepository.find({
      skip,
      take,
      order: { [order_column]: direction },
    });
    return rows.map((row) => this.feature_row_to_domain(row));
  }

  async save(feature: Feature): Promise<void> {
    await this.featureRepository.save(feature.toPrimitives());
  }

  async persist_updated(feature: Feature): Promise<void> {
    const primitive = feature.toPrimitives();
    const row = await this.featureRepository.preload({
      id: primitive.id,
      name: primitive.name,
      slug: primitive.slug,
    });
    if (!row) {
      throw new FeatureNotFoundException(primitive.id);
    }
    await this.featureRepository.save(row);
  }

  async remove(id: string): Promise<void> {
    await this.featureRepository.delete(id);
  }
}