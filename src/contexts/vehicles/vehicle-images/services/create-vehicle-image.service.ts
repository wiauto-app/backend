import { NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { EntitlementsService } from "@/src/contexts/billing/services/entitlements.service";
import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { VehicleEntity } from "@/src/contexts/vehicles/entities/vehicle.entity";

import { CreateVehicleImageDto } from "../dto/create-vehicle-image.dto";
import { TypeOrmVehicleImagesRepository } from "@/src/contexts/vehicles/vehicle-images/repositories/typeorm.vehicle-images.repository";
import { PrimitiveVehicleImage, VehicleImage } from "../types/vehicle-image";

@Injectable()
export class CreateVehicleImageService {
  constructor(
    private readonly vehicleImageRepository: TypeOrmVehicleImagesRepository,
    private readonly entitlements_service: EntitlementsService,
    @InjectRepository(VehicleEntity)
    private readonly vehicle_repository: Repository<VehicleEntity>,
  ) {}

  async execute(
    createVehicleImageDto: CreateVehicleImageDto,
  ): Promise<{ image: PrimitiveVehicleImage }> {
    const vehicle = await this.vehicle_repository.findOne({
      where: { id: createVehicleImageDto.vehicle_id },
      relations: { profile: true },
    });
    if (!vehicle?.profile.id) {
      throw new NotFoundException("Vehículo no encontrado");
    }

    const current_count = await this.vehicleImageRepository.countByVehicleId(
      createVehicleImageDto.vehicle_id,
    );
    await this.entitlements_service.assertCanAddPhotos(
      vehicle.profile.id,
      current_count,
      1,
    );

    const image = VehicleImage.create(createVehicleImageDto);
    await this.vehicleImageRepository.save(image);
    return { image: image.toPrimitives() };
  }
}