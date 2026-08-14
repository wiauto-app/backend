import { Controller, Delete, Param, ParseUUIDPipe, UseGuards } from "@nestjs/common";
import { RemoveVehicleImageService } from "../../../services/remove-vehicle-image.service";
import { V1_VEHICLE_IMAGES_REMOVE } from "../../route.constants";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";

@UseGuards(JwtGuard)
@Controller(V1_VEHICLE_IMAGES_REMOVE)
export class RemoveVehicleImageController {

  constructor(private readonly removeVehicleImageService: RemoveVehicleImageService) {}

  @Delete(":id")
  run(@Param("id", ParseUUIDPipe) id: string,@GetUserId() userId: string) {
    return this.removeVehicleImageService.execute({ id }, userId);
  }
  }