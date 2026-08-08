import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { applyDecorators, UseGuards } from "@nestjs/common";
import { VehicleCreationGuard } from "../guards/vehicleCreation.guard";

/** JWT + cuota de anuncios vía entitlements (`users.is_admin` bypass). */
export const CreateVehicleAuth = () =>
  applyDecorators(UseGuards(JwtGuard, VehicleCreationGuard));
