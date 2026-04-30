import { BadRequestException, PipeTransform } from "@nestjs/common";

import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { ALLOWED_IMAGES_COUNT, ALLOWED_MIME_TYPES, TEN_MB } from "../media.constants";

@Injectable()
export class ImageValidationPipe implements PipeTransform {
  transform(files: Express.Multer.File[] | undefined) {
    const list = files ?? [];

    if (list.length > ALLOWED_IMAGES_COUNT) {
      throw new BadRequestException("No se pueden subir más de 10 imágenes");
    }

    for (const file of list) {
      if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        throw new BadRequestException("Tipo de archivo no permitido");
      }
      if (file.size > TEN_MB) {
        throw new BadRequestException("La imagen es demasiado grande, debe ser menor a 6MB");
      }
    }

    return list;
  }
}
