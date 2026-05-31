import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";

import { VehicleEntity } from "@/src/contexts/vehicles/infrastructure/persistence/vehicle.entity";

import {
  VEHICLE_PRICE_STATUS,
  VehiclePrice,
} from "../../domain/vehicle-price";
import { VehiclePriceRepository } from "../../domain/vehicle-price.repository";
import { VehiclePriceEntity } from "../persistence/vehicle-price.entity";

const entity_to_domain = (entity: VehiclePriceEntity): VehiclePrice =>
  VehiclePrice.fromPrimitives({
    id: entity.id,
    price: entity.price,
    status: entity.status,
    vehicle_id: entity.vehicle_id,
    created_at: entity.created_at,
  });

@Injectable()
export class TypeOrmVehiclePriceRepository extends VehiclePriceRepository {
  constructor(
    @InjectRepository(VehiclePriceEntity)
    private readonly vehicle_price_repository: Repository<VehiclePriceEntity>,
    @InjectDataSource()
    private readonly data_source: DataSource,
  ) {
    super();
  }

  private to_entity(vehicle_price: VehiclePrice): VehiclePriceEntity {
    const p = vehicle_price.toPrimitives();
    return this.vehicle_price_repository.create({
      id: p.id,
      price: p.price,
      status: p.status,
      created_at: p.created_at,
      vehicle: { id: p.vehicle_id } as VehicleEntity,
      vehicle_id: p.vehicle_id,
    });
  }

  async create(vehicle_price: VehiclePrice): Promise<void> {
    const p = vehicle_price.toPrimitives();

    if (p.status === VEHICLE_PRICE_STATUS.ACTIVE) {
      await this.data_source.transaction(async (manager) => {
        await manager.update(
          VehiclePriceEntity,
          { vehicle_id: p.vehicle_id, status: VEHICLE_PRICE_STATUS.ACTIVE },
          { status: VEHICLE_PRICE_STATUS.INACTIVE },
        );
        await manager.save(this.to_entity(vehicle_price));
      });
      return;
    }

    await this.vehicle_price_repository.save(this.to_entity(vehicle_price));
  }

  async findByVehicleId(vehicle_id: string): Promise<VehiclePrice[]> {
    const rows = await this.vehicle_price_repository.find({
      where: { vehicle_id },
      order: { created_at: "DESC" },
    });
    return rows.map(entity_to_domain);
  }

  async findActiveByVehicleId(vehicle_id: string): Promise<VehiclePrice | null> {
    const row = await this.vehicle_price_repository.findOne({
      where: { vehicle_id, status: VEHICLE_PRICE_STATUS.ACTIVE },
    });
    if (!row) {
      return null;
    }
    return entity_to_domain(row);
  }

  async findOneByIdAndVehicleId(
    vehicle_price_id: string,
    vehicle_id: string,
  ): Promise<VehiclePrice | null> {
    const row = await this.vehicle_price_repository.findOne({
      where: { id: vehicle_price_id, vehicle_id },
    });
    if (!row) {
      return null;
    }
    return entity_to_domain(row);
  }

  async activatePrice(vehicle_id: string, vehicle_price_id: string): Promise<void> {
    await this.data_source.transaction(async (manager) => {
      await manager.update(
        VehiclePriceEntity,
        { vehicle_id, status: VEHICLE_PRICE_STATUS.ACTIVE },
        { status: VEHICLE_PRICE_STATUS.INACTIVE },
      );

      const preloaded = await manager.preload(VehiclePriceEntity, {
        id: vehicle_price_id,
        vehicle_id,
        status: VEHICLE_PRICE_STATUS.ACTIVE,
      });

      if (!preloaded) {
        return;
      }

      await manager.save(preloaded);
    });
  }

  async deactivateAllByVehicleId(vehicle_id: string): Promise<void> {
    await this.vehicle_price_repository.update(
      { vehicle_id, status: VEHICLE_PRICE_STATUS.ACTIVE },
      { status: VEHICLE_PRICE_STATUS.INACTIVE },
    );
  }
}
