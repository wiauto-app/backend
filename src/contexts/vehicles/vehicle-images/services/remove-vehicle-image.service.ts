import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { VehicleImagesEntity } from "../entities/vehicle-images.entity";
import { RemoveVehicleImageDto } from "../dto/remove-vehicle-image.dto";
import { ObjectStorageService } from "@/src/contexts/shared/object-storage/object-storage.service";
import { VehiclePermissionsService } from "../../api/v1/vehicle-permissions/vehicle-permissions.service";

@Injectable()
export class RemoveVehicleImageService {

  constructor(
    @InjectRepository(VehicleImagesEntity)
    private readonly vehicleImageRepository: Repository<VehicleImagesEntity>,
    private readonly objectStorageService: ObjectStorageService,
    private readonly vehiclePermissionsService: VehiclePermissionsService,
  ) {}

  async execute(removeVehicleImageDto: RemoveVehicleImageDto, userId: string): Promise<void> {
    
    const vehicleImage = await this.vehicleImageRepository.findOne({
      where: { id: removeVehicleImageDto.id },
      relations: {
        vehicle: true
      },
    });
    if (!vehicleImage) {
      throw new NotFoundException("Vehicle image not found");
    }

    const vehicle_id = vehicleImage.vehicle_id;
    const canModifyVehicle = await this.vehiclePermissionsService.canModifyVehicle(vehicle_id, userId);

    if (!canModifyVehicle) {
      throw new ForbiddenException("You are not allowed to remove this vehicle image");
    }
    
    // Eliminar URL final si existe
    if (vehicleImage.url) {
      await this.objectStorageService.deleteByPath(vehicleImage.url);
    }
    
    // Eliminar source_path (TEMP) si existe y es diferente
    if (vehicleImage.source_path && vehicleImage.source_path !== vehicleImage.url) {
      await this.objectStorageService.deleteByPath(vehicleImage.source_path);
    }
    
    await this.vehicleImageRepository.delete(removeVehicleImageDto.id);
  }
}