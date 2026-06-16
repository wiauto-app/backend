import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Comunity } from "./comunities/entities/comunity.entity";
import { CommunitiesUseCase } from "./communities/application/communities-use-cases/communities.use-case";
import { CommunitiesRepository } from "./communities/domain/repositories/communities.repository";
import { CommunitiesController } from "./communities/infrastructure/http-api/v1/communities-v1/communities.controller";
import { TypeormCommunitiesRepository } from "./communities/infrastructure/repositories/typeorm.communities-repository";
import { MunicipalitiesUseCase } from "./municipalities/application/municipalities-use-cases/municipalities.use-case";
import { MunicipalitiesRepository } from "./municipalities/domain/repositories/municipalities.repository";
import { Municipality } from "./municipalities/entities/municipality.entity";
import { MunicipalitiesController } from "./municipalities/infrastructure/http-api/v1/municipalities-v1/municipalities.controller";
import { TypeormMunicipalitiesRepository } from "./municipalities/infrastructure/repositories/typeorm.municipalities-repository";
import { ProvincesUseCase } from "./provinces/application/provinces-use-cases/provinces.use-case";
import { ProvincesRepository } from "./provinces/domain/repositories/provinces.repository";
import { Provinces } from "./provinces/entities/province.entity";
import { ProvincesController } from "./provinces/infrastructure/http-api/v1/provinces-v1/provinces.controller";
import { TypeormProvincesRepository } from "./provinces/infrastructure/repositories/typeorm.provinces-repository";

@Module({
  controllers: [
    ProvincesController,
    CommunitiesController,
    MunicipalitiesController,
  ],
  imports: [TypeOrmModule.forFeature([Provinces, Comunity, Municipality])],
  providers: [
    ProvincesUseCase,
    TypeormProvincesRepository,
    {
      provide: ProvincesRepository,
      useExisting: TypeormProvincesRepository,
    },
    CommunitiesUseCase,
    TypeormCommunitiesRepository,
    {
      provide: CommunitiesRepository,
      useExisting: TypeormCommunitiesRepository,
    },
    MunicipalitiesUseCase,
    TypeormMunicipalitiesRepository,
    {
      provide: MunicipalitiesRepository,
      useExisting: TypeormMunicipalitiesRepository,
    },
  ],
  exports: [TypeOrmModule],
})
export class LocationsModule {}
