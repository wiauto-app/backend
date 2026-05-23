import { BadRequestException } from "@nestjs/common";

export class TempStoragePathInvalidException extends BadRequestException {
  constructor(stored_path: string) {
    super(
      `La ruta "${stored_path}" no es temporal o no cumple la convención (debe incluir el segmento "temp").`,
    );
  }
}
