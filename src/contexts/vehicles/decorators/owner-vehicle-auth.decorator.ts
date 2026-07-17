import { applyDecorators, UseGuards } from "@nestjs/common";

import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { VehicleCreationGuard } from "../guards/vehicleCreation.guard";
import { VehicleOwnerGuard } from "../guards/vehicle-owner.guard";

export const DuplicateVehicleAuth = () =>
  applyDecorators(
    UseGuards(JwtGuard, VehicleOwnerGuard, VehicleCreationGuard),
  );

export const OwnerVehicleActionAuth = () =>
  applyDecorators(UseGuards(JwtGuard, VehicleOwnerGuard));
