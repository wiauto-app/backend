import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { TypeOrmDealershipMemberRepository } from "@/src/contexts/dealership/repositories/typeorm.dealership-member-repository";
import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { VehicleEntity } from "../entities/vehicle.entity";
import { normalizeNullableUuid, PUBLISHER_TYPE } from "../types/vehicle";
import { VehicleDetailCacheService } from "./vehicle-detail-cache.service";

@Injectable()
export class VehiclePublisherSyncService {
  constructor(
    private readonly dealership_member_repository: TypeOrmDealershipMemberRepository,
    @InjectRepository(VehicleEntity)
    private readonly vehicle_repository: Repository<VehicleEntity>,
    private readonly vehicle_detail_cache: VehicleDetailCacheService,
  ) {}

  /** Alinea publisher_type y dealership_id de todos los anuncios del perfil con su membresía actual. */
  async syncForProfile(profile_id: string): Promise<void> {
    const membership =
      await this.dealership_member_repository.findOneByProfileId(profile_id);

    const target_publisher_type = membership
      ? PUBLISHER_TYPE.DEALERSHIP
      : PUBLISHER_TYPE.PARTICULAR;
    const target_dealership_id = membership?.dealership_id ?? null;

    const vehicles = await this.vehicle_repository.find({
      where: { profile_id },
      select: {
        id: true,
        publisher_type: true,
        dealership_id: true,
      },
    });

    for (const vehicle of vehicles) {
      const dealership_matches =
        normalizeNullableUuid(vehicle.dealership_id) ===
        normalizeNullableUuid(target_dealership_id);

      if (
        vehicle.publisher_type === target_publisher_type &&
        dealership_matches
      ) {
        continue;
      }

      const preloaded = await this.vehicle_repository.preload({
        id: vehicle.id,
        publisher_type: target_publisher_type,
        dealership_id: target_dealership_id,
      });

      if (!preloaded) {
        continue;
      }

      await this.vehicle_repository.save(preloaded);
      await this.vehicle_detail_cache.invalidate(vehicle.id);
    }
  }
}
