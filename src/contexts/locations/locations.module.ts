import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Comunity } from "./comunities/entities/comunity.entity";
import { CommunitiesService } from "./communities/services/communities.service";
import { TypeormCommunitiesRepository } from "@/src/contexts/locations/communities/repositories/typeorm.communities-repository";
import { CommunitiesController } from "./communities/api/v1/communities-v1/communities.controller";
import { MunicipalitiesService } from "./municipalities/services/municipalities.service";
import { TypeormMunicipalitiesRepository } from "@/src/contexts/locations/municipalities/repositories/typeorm.municipalities-repository";
import { Municipality } from "./municipalities/entities/municipality.entity";
import { MunicipalitiesController } from "./municipalities/api/v1/municipalities-v1/municipalities.controller";
import { ProvincesService } from "./provinces/services/provinces.service";
import { TypeormProvincesRepository } from "@/src/contexts/locations/provinces/repositories/typeorm.provinces-repository";
import { Provinces } from "./provinces/entities/province.entity";
import { ProvincesController } from "./provinces/api/v1/provinces-v1/provinces.controller";

@Module({
  controllers: [
    ProvincesController,
    CommunitiesController,
    MunicipalitiesController],
  imports: [TypeOrmModule.forFeature([Provinces, Comunity, Municipality])],
  providers: [
    ProvincesService,
    TypeormProvincesRepository,
    CommunitiesService,
    TypeormCommunitiesRepository,
    MunicipalitiesService,
    TypeormMunicipalitiesRepository
  ],
  exports: [TypeOrmModule],
})
export class LocationsModule {}
