import { IsNotEmpty, IsNumber, IsString, Max, Min, MinLength } from "class-validator";
import { IsTempStoragePath } from "@/src/contexts/shared/file/validators/is-temp-storage-path.validator";

export class VehicleMediaHttpDto {
  @IsString({ message: "La ruta del vídeo no es válida." })
  @IsNotEmpty({ message: "Falta la ruta del vídeo." })
  @MinLength(1, { message: "La ruta del vídeo no puede estar vacía." })
  @IsTempStoragePath({
    message: "El vídeo no se ha subido correctamente. Vuelve a añadirlo.",
  })
  path: string;

  @IsNumber({}, { message: "El orden del vídeo debe ser un número." })
  @IsNotEmpty({ message: "Indica el orden del vídeo." })
  @Min(0, { message: "El orden del vídeo no puede ser negativo." })
  @Max(100, { message: "El orden del vídeo no puede ser mayor a 100." })
  order: number;
}
