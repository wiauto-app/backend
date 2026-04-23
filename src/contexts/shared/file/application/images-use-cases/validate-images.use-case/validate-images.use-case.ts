import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { ALLOWED_MIME_TYPES, SIX_MB } from "../../../infrastructure/media.constants";

@Injectable()
export class ValidateImagesUseCase {

  execute(files: Express.Multer.File[]): {
    isValid: boolean;
    message: string;
  } {
    //validacion
    for (const file of files) {
      const { mimetype, originalname, size } = file;
      if (!mimetype || !originalname || !size) {
        return { isValid: false, message: "El archivo no es válido" };
      }
      if (!ALLOWED_MIME_TYPES.includes(mimetype)) {
        return { isValid: false, message: "Tipo de imagen no permitido" };
      }
      if (size > SIX_MB) {
        return { isValid: false, message: "La imagen es demasiado grande, debe ser menor a 6MB" };
      }
    }
    return { isValid: true, message: "Las imágenes son válidas" };
  }
}