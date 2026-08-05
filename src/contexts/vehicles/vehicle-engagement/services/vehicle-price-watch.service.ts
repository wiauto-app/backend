import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { QueryFailedError, Repository } from "typeorm";

import { VehicleNotFoundException } from "../../exceptions/vehicle-not-found.exception";
import { VehicleEntity } from "../../entities/vehicle.entity";
import { VehiclePriceWatchEntity } from "../entities/vehicle-price-watch.entity";
import { VehiclePriceWatchAlreadyExistsException } from "../exceptions/vehicle-price-watch-already-exists.exception";
import { VehiclePriceWatchNotFoundException } from "../exceptions/vehicle-price-watch-not-found.exception";

interface CreatePriceWatchInput {
  profile_id: string;
  vehicle_id: string;
}

interface PriceWatchByVehicleInput {
  profile_id: string;
  vehicle_id: string;
}

const isUniqueViolation = (error: unknown): boolean =>
  error instanceof QueryFailedError &&
  (error as QueryFailedError & { driverError?: { code?: string } }).driverError
    ?.code === "23505";

@Injectable()
export class VehiclePriceWatchService {
  constructor(
    @InjectRepository(VehiclePriceWatchEntity)
    private readonly priceWatchRepository: Repository<VehiclePriceWatchEntity>,
    @InjectRepository(VehicleEntity)
    private readonly vehicleRepository: Repository<VehicleEntity>,
  ) {}

  async create(input: CreatePriceWatchInput): Promise<VehiclePriceWatchEntity> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id: input.vehicle_id },
    });
    if (!vehicle) {
      throw new VehicleNotFoundException(input.vehicle_id);
    }

    const created = this.priceWatchRepository.create({
      profile_id: input.profile_id,
      vehicle_id: input.vehicle_id,
    });

    try {
      return await this.priceWatchRepository.save(created);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new VehiclePriceWatchAlreadyExistsException();
      }
      throw error;
    }
  }

  async remove(input: PriceWatchByVehicleInput): Promise<void> {
    const existing = await this.findOneOrFail(input);
    await this.priceWatchRepository.remove(existing);
  }

  async findOne(
    input: PriceWatchByVehicleInput,
  ): Promise<VehiclePriceWatchEntity> {
    return this.findOneOrFail(input);
  }

  private async findOneOrFail(
    input: PriceWatchByVehicleInput,
  ): Promise<VehiclePriceWatchEntity> {
    const existing = await this.priceWatchRepository.findOne({
      where: {
        profile_id: input.profile_id,
        vehicle_id: input.vehicle_id,
      },
    });
    if (!existing) {
      throw new VehiclePriceWatchNotFoundException(input.vehicle_id);
    }
    return existing;
  }

  async findProfileIdsByVehicleId(vehicleId: string): Promise<string[]> {
    const rows = await this.priceWatchRepository.find({
      where: { vehicle_id: vehicleId },
      select: ["profile_id"],
    });

    return [...new Set(rows.map((row) => row.profile_id))];
  }
}
