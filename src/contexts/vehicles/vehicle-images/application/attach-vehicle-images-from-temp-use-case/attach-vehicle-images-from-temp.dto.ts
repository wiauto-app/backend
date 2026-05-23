import { ImageDto } from "@/src/contexts/vehicles/application/vehicle/create-vehicle-use-case/image.dto";

export class AttachVehicleImagesFromTempDto {
  vehicle_id: string;
  images: ImageDto[];
}
