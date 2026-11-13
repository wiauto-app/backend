import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { DealershipMembersEntity } from "@/src/contexts/dealership/entities/dealership-members.entity";
import { TypeOrmDealershipMemberRepository } from "@/src/contexts/dealership/repositories/typeorm.dealership-member-repository";

import { VehicleEntity } from "./entities/vehicle.entity";
import { VehicleDetailCacheService } from "./services/vehicle-detail-cache.service";
import { VehiclePublisherSyncService } from "./services/vehicle-publisher-sync.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([VehicleEntity, DealershipMembersEntity]),
  ],
  providers: [
    VehiclePublisherSyncService,
    VehicleDetailCacheService,
    TypeOrmDealershipMemberRepository,
  ],
  exports: [VehiclePublisherSyncService],
})
export class VehiclePublisherSyncModule {}
