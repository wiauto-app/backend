import { DealershipMembersEntity } from "@/src/contexts/dealership/entities/dealership-members.entity";
import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { TypeOrmVehicleRepository } from "../../../repositories/typeorm.vehicle-repository";
import { User } from "@/src/contexts/users/entities/user.entity";

@Injectable()
export class VehiclePermissionsService {
  constructor(
    @InjectRepository(DealershipMembersEntity)
    private readonly dealershipMembersRepository: Repository<DealershipMembersEntity>,
    private readonly vehicle_repository: TypeOrmVehicleRepository,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

  ) { }

  async canModifyVehicle(vehicleId: string, profile_id: string): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: {
        id: profile_id,
      },
    });

    if (!user) {
      throw new NotFoundException("Usuario no encontrado");
    }
    if (user.is_admin) {
      return true;
    }


    const vehicle = await this.vehicle_repository
      .findById(vehicleId)
      .then((vehicle) => vehicle?.toPrimitives());

    if (!vehicle) {
      throw new NotFoundException("Vehículo no encontrado");
    }

    /**
   * Un usuario puede actualizar el vehículo si:
   *
   * 1. Es directamente el propietario del vehículo.
   * 2. El vehículo pertenece a un dealership y el usuario
   *    forma parte de sus miembros.
   */
    const is_owner = vehicle.profile_id === profile_id;

    let is_dealership_member = false;

    if (vehicle.dealership_id) {
      const dealership_member =
        await this.dealershipMembersRepository.findOne({
          where: {
            dealership_id: vehicle.dealership_id,
            profile_id,
          },
        });

      is_dealership_member = !!dealership_member;
    }

    const can_update = is_owner || is_dealership_member;

    if (!can_update) {
      throw new ForbiddenException(
        "No tienes permisos para actualizar este vehículo",
      );
    }

    return can_update;
  }
}