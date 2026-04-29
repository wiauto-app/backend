import { InjectRepository } from "@nestjs/typeorm";
import { VehicleTypesRepository } from "../../domain/repositories/vehicle-types.repository";
import { VehicleTypeEntity } from "../persistence/vehicle-type.entity";
import { Repository } from "typeorm";
import { VehicleType } from "../../domain/entities/vehicle-types";


export class TypeormVehicleTypeRepository extends VehicleTypesRepository {
  constructor(
    @InjectRepository(VehicleTypeEntity)
    private readonly vehicleTypeRepository: Repository<VehicleTypeEntity>,
  ){
    super();
  }

  async findAll(): Promise<VehicleType[]> {
    const vehicleTypes = await this.vehicleTypeRepository.find();
    return vehicleTypes.map((vehicleType) => VehicleType.fromPrimitives(vehicleType));
  }

  async findOne(id: string): Promise<VehicleType | null> {
    const vehicleType = await this.vehicleTypeRepository.findOne({ where: { id } });
    if (!vehicleType) {
      return null;
    }
    return VehicleType.fromPrimitives(vehicleType);
  }

  async save(vehicleType: VehicleType): Promise<void> {
    await this.vehicleTypeRepository.save(vehicleType.toPrimitives());
  }

  async update(id: string, name: string): Promise<void> {
    await this.vehicleTypeRepository.update(id, { name });
  }

  async remove(id: string): Promise<void> {
    await this.vehicleTypeRepository.delete(id);
  }
}