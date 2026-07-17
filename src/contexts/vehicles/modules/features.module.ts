import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { FeaturesEntity } from "../entities/features.entity";
import { FeaturesController } from "../api/feature-v1/features.controller";
import { FeaturesService } from "../services/features.service";

@Module({
  controllers: [FeaturesController],
  imports: [TypeOrmModule.forFeature([FeaturesEntity])],
  providers: [FeaturesService],
  exports: [FeaturesService],
})
export class FeaturesModule {}
