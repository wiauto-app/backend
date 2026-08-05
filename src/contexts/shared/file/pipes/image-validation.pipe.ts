import path from "node:path";

import { BadRequestException, PipeTransform } from "@nestjs/common";

import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import {
  ALLOWED_IMAGE_EXTENSIONS,
  ALLOWED_MIME_TYPES,
  TEN_MB,
} from "../media.constants";

const UNRELIABLE_MIME_TYPES = new Set(["", "application/octet-stream"]);

const isAllowedByMime = (mimetype: string): boolean =>
  (ALLOWED_MIME_TYPES as readonly string[]).includes(mimetype);

const isAllowedByExtension = (originalname: string): boolean => {
  const extension = path.extname(originalname).toLowerCase();
  return (ALLOWED_IMAGE_EXTENSIONS as readonly string[]).includes(extension);
};

const isAllowedImageFile = (file: Express.Multer.File): boolean => {
  const mime = file.mimetype.trim().toLowerCase();

  if (isAllowedByMime(mime)) {
    return true;
  }

  // Safari/iOS a menudo envía HEIC sin MIME o como octet-stream.
  if (UNRELIABLE_MIME_TYPES.has(mime)) {
    return isAllowedByExtension(file.originalname);
  }

  return false;
};

@Injectable()
export class ImageValidationPipe implements PipeTransform {
  transform(
    value: Express.Multer.File | Express.Multer.File[] | undefined,
  ): Express.Multer.File | Express.Multer.File[] {
    if (value == null) {
      throw new BadRequestException("Debes enviar una imagen en el campo file");
    }

    const isArray = Array.isArray(value);
    const list = isArray ? value : [value];

    if (list.length === 0) {
      throw new BadRequestException("Debes enviar una imagen en el campo file");
    }

    for (const file of list) {
      if (!isAllowedImageFile(file)) {
        throw new BadRequestException(
          "Tipo de archivo no permitido. Usa JPG, PNG, WebP, AVIF, GIF, BMP, TIFF o HEIC/HEIF.",
        );
      }
      if (file.size > TEN_MB) {
        throw new BadRequestException(
          "La imagen es demasiado grande, debe ser menor a 10MB",
        );
      }
    }

    return isArray ? list : list[0];
  }
}
