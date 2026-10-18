import { CreateVehicleAuth } from "@/src/contexts/vehicles/decorators/create-vehicle-auth.decorator";
import {
  Body,
  Controller,
  Post,
  Req,
  UnauthorizedException,
} from "@nestjs/common";
import { Request } from "express";
import { readGuestId } from "@/src/contexts/vehicles/vehicle-images/guest/guest-upload-identity";

import { User } from "@/src/contexts/users/entities/user.entity";
import { VehiclePublishMetaCapiService } from "@/src/contexts/analytics/services/vehicle-publish-meta-capi.service";
import { V1_VEHICLES } from "../../route.constants";
import { CreateVehicleDto } from "./create-vehicle.http-dto";
import { CreateVehicleService } from "./create-vehicle.service";

@Controller(V1_VEHICLES)
export class CreateVehicleController {
  constructor(
    private readonly create_vehicle_service: CreateVehicleService,
    private readonly vehicle_publish_meta_capi_service: VehiclePublishMetaCapiService,
  ) {}

  @Post()
  @CreateVehicleAuth()
  async run(
    @Body() dto: CreateVehicleDto,
    @Req() req: Request & { user?: User },
  ) {
    const user = req.user;
    if (!user) {
      throw new UnauthorizedException("Usuario no autenticado");
    }
    // Permite reclamar las fotos subidas como invitado antes del login
    const created = await this.create_vehicle_service.create(
      dto,
      user.id,
      readGuestId(req),
    );

    const address = created.address_details;
    this.vehicle_publish_meta_capi_service.sendAfterVehicleCreated({
      tracking: dto.tracking,
      user,
      req,
      listing: {
        id: created.id,
        price: dto.price,
        versionId: dto.version_id,
        vehicleTypeId: dto.vehicle_type_id,
        province: address?.province ?? null,
        city: address?.municipality ?? null,
        zip: address?.postal_code ?? null,
        email: dto.email,
        phone: dto.phone,
      },
    });

    return created;
  }
}
