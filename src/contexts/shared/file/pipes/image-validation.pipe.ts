import { BadRequestException, PipeTransform } from "@nestjs/common";

import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import {  ALLOWED_MIME_TYPES, TEN_MB } from "../media.constants";

@Injectable()
export class ImageValidationPipe implements PipeTransform {
  transform(files: Express.Multer.File[] | undefined) {
    const list = files ?? [];

    for (const file of list) {
      if (
        !(ALLOWED_MIME_TYPES as readonly string[]).includes(file.mimetype)
      ) {
        throw new BadRequestException("Tipo de archivo no permitido");
      }
      if (file.size > TEN_MB) {
        throw new BadRequestException("La imagen es demasiado grande, debe ser menor a 6MB");
      }
    }

    return list;
  }
}
