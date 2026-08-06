import path from "node:path";

import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import {
  ALLOWED_IMAGE_EXTENSIONS,
  ALLOWED_MIME_TYPES,
  TEN_MB,
} from "../media.constants";

const UNRELIABLE_MIME_TYPES = new Set(["", "application/octet-stream"]);

@Injectable()
export class ValidateImagesService {
  execute(files: Express.Multer.File[]): {
    isValid: boolean;
    message: string;
  } {
    for (const file of files) {
      const { mimetype, originalname, size } = file;
      if (!originalname || !size) {
        return { isValid: false, message: "El archivo no es válido" };
      }

      const mime = (mimetype ?? "").trim().toLowerCase();
      const allowedByMime = (ALLOWED_MIME_TYPES as readonly string[]).includes(mime);
      const allowedByExtension =
        UNRELIABLE_MIME_TYPES.has(mime) &&
        (ALLOWED_IMAGE_EXTENSIONS as readonly string[]).includes(
          path.extname(originalname).toLowerCase(),
        );

      if (!allowedByMime && !allowedByExtension) {
        return { isValid: false, message: "Tipo de imagen no permitido" };
      }
      if (size > TEN_MB) {
        return {
          isValid: false,
          message: "La imagen es demasiado grande, debe ser menor a 10MB",
        };
      }
    }
    return { isValid: true, message: "Las imágenes son válidas" };
  }
}
