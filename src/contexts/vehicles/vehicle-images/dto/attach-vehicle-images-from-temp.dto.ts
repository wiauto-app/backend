import { ImageDto } from "@/src/contexts/vehicles/dto/image.dto";

export class AttachVehicleImagesFromTempDto {
  vehicle_id: string;
  images: ImageDto[];
}
