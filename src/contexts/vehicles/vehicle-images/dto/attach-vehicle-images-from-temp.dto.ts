import { ImageDto } from "@/src/contexts/vehicles/dto/image.dto";

export class AttachVehicleImagesFromTempDto {
  vehicle_id: string;
  images: ImageDto[];
  /** Quien subió los `upload_id` (p. ej. admin); por defecto el dueño del anuncio. */
  uploader_profile_id?: string;
}
