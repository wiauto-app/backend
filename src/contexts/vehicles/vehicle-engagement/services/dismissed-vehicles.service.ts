import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { QueryFailedError, Repository } from "typeorm";

import { ProfileEntity } from "@/src/contexts/profiles/entities/profile.entity";

import { VehicleEntity } from "../../entities/vehicle.entity";
import { VehicleNotFoundException } from "../../exceptions/vehicle-not-found.exception";
import type { VehicleListItemPreview } from "../../types/vehicle-list-detail";
import { PUBLISHER_TYPE } from "../../types/vehicle";
import type { VehicleImagesEntity } from "../../vehicle-images/entities/vehicle-images.entity";
import type { VehiclePriceEntity } from "../../vehicle-prices/entities/vehicle-price.entity";
import { VEHICLE_PRICE_STATUS } from "../../vehicle-prices/types/vehicle-price";
import { DismissedVehicleEntity } from "../entities/dismissed-vehicle.entity";
import { DismissedVehicleAlreadyExistsException } from "../exceptions/dismissed-vehicle-already-exists.exception";
import { DismissedVehicleNotFoundException } from "../exceptions/dismissed-vehicle-not-found.exception";
import { DismissedVehiclesProfessionalRequiredException } from "../exceptions/dismissed-vehicles-professional-required.exception";
import type { DismissedVehicleListItem } from "../types/dismissed-vehicle-list-item";

interface CreateDismissedVehicleInput {
  profile_id: string;
  vehicle_id: string;
}

interface DismissedVehicleByVehicleInput {
  profile_id: string;
  vehicle_id: string;
}

const isUniqueViolation = (error: unknown): boolean =>
  error instanceof QueryFailedError &&
  (error as QueryFailedError & { driverError?: { code?: string } }).driverError
    ?.code === "23505";

const firstImageUrl = (
  images: VehicleImagesEntity[] | undefined,
): string | null => {
  if (!images || images.length === 0) {
    return null;
  }
  const sorted = [...images].sort(
    (a, b) => a.created_at.getTime() - b.created_at.getTime(),
  );
  return sorted[0]?.url ?? null;
};

const getActivePrice = (
  vehiclePrices: VehiclePriceEntity[] | undefined,
): number => {
  const active = vehiclePrices?.find(
    (item) => item.status === VEHICLE_PRICE_STATUS.ACTIVE,
  );
  return active?.price ?? 0;
};

const getPreviousPrice = (
  vehiclePrices: VehiclePriceEntity[] | undefined,
): number | null => {
  const previous = [...(vehiclePrices ?? [])]
    .filter((item) => item.status === VEHICLE_PRICE_STATUS.INACTIVE)
    .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())[0];
  return previous?.price ?? null;
};

const mapVehiclePreview = (vehicle: VehicleEntity): VehicleListItemPreview => {
  const price = getActivePrice(vehicle.vehicle_prices);
  const previousPrice = getPreviousPrice(vehicle.vehicle_prices);

  return {
    id: vehicle.id,
    version_summary: {
      make_name: vehicle.version?.make?.name ?? "",
      model_name: vehicle.version?.model?.name ?? "",
      version_name: vehicle.version?.name ?? "",
    },
    price,
    image_url: firstImageUrl(vehicle.images),
    created_at: vehicle.created_at,
    condition: vehicle.condition,
    is_featured: vehicle.is_featured,
    category: vehicle.category
      ? { id: vehicle.category.id, name: vehicle.category.name }
      : null,
    publisher_id: vehicle.profile.id,
    publisher_name: vehicle.profile.name,
    previous_price: previousPrice,
    price_change: previousPrice === null ? null : price - previousPrice,
  };
};

@Injectable()
export class DismissedVehiclesService {
  constructor(
    @InjectRepository(DismissedVehicleEntity)
    private readonly dismissedRepository: Repository<DismissedVehicleEntity>,
    @InjectRepository(VehicleEntity)
    private readonly vehicleRepository: Repository<VehicleEntity>,
    @InjectRepository(ProfileEntity)
    private readonly profileRepository: Repository<ProfileEntity>,
  ) {}

  async create(
    input: CreateDismissedVehicleInput,
  ): Promise<DismissedVehicleEntity> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id: input.vehicle_id },
    });
    if (!vehicle) {
      throw new VehicleNotFoundException(input.vehicle_id);
    }

    const created = this.dismissedRepository.create({
      profile_id: input.profile_id,
      vehicle_id: input.vehicle_id,
    });

    try {
      return await this.dismissedRepository.save(created);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new DismissedVehicleAlreadyExistsException();
      }
      throw error;
    }
  }

  async remove(input: DismissedVehicleByVehicleInput): Promise<void> {
    const existing = await this.findOneOrFail(input);
    await this.dismissedRepository.remove(existing);
  }

  async findOne(
    input: DismissedVehicleByVehicleInput,
  ): Promise<DismissedVehicleEntity> {
    return this.findOneOrFail(input);
  }

  private async findOneOrFail(
    input: DismissedVehicleByVehicleInput,
  ): Promise<DismissedVehicleEntity> {
    const existing = await this.dismissedRepository.findOne({
      where: {
        profile_id: input.profile_id,
        vehicle_id: input.vehicle_id,
      },
    });
    if (!existing) {
      throw new DismissedVehicleNotFoundException(input.vehicle_id);
    }
    return existing;
  }

  async findVehicleIdsByProfileId(profileId: string): Promise<string[]> {
    const rows = await this.dismissedRepository.find({
      where: { profile_id: profileId },
      select: ["vehicle_id"],
    });

    return rows.map((row) => row.vehicle_id);
  }

  async findAllForProfessional(
    profileId: string,
  ): Promise<DismissedVehicleListItem[]> {
    const profile = await this.profileRepository.findOne({
      where: { id: profileId },
    });
    if (!profile || profile.type !== PUBLISHER_TYPE.PROFESSIONAL) {
      throw new DismissedVehiclesProfessionalRequiredException();
    }

    const rows = await this.dismissedRepository.find({
      where: { profile_id: profileId },
      relations: {
        vehicle: {
          version: { make: true, model: true },
          category: true,
          profile: true,
          images: true,
          vehicle_prices: true,
        },
      },
      order: { created_at: "DESC" },
    });

    return rows
      .filter((row) => row.vehicle)
      .map((row) => ({
        id: row.id,
        profile_id: row.profile_id,
        vehicle_id: row.vehicle_id,
        created_at: row.created_at,
        vehicle: mapVehiclePreview(row.vehicle),
      }));
  }
}
