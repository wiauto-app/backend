import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  MinLength,
  ValidateIf,
} from "class-validator";

/**
 * Imagen en update: existente (`id` + `path`), async nueva (`upload_id`) o legacy temp (`path`).
 * Debe incluir `upload_id` o `path`.
 */
export class UpdateImageHttpDto {
  @IsUUID(undefined, { message: "La foto no es válida." })
  @IsOptional()
  id?: string;

  @ValidateIf((o: UpdateImageHttpDto) => !o.path)
  @IsUUID("4", {
    message: "La foto no se ha subido correctamente. Vuelve a añadirla.",
  })
  @IsNotEmpty({ message: "Falta la referencia de subida de la foto." })
  upload_id?: string;

  @ValidateIf((o: UpdateImageHttpDto) => !o.upload_id)
  @IsString({ message: "La ruta de la foto no es válida." })
  @IsNotEmpty({ message: "Falta la ruta de la foto." })
  @MinLength(1, { message: "La ruta de la foto no puede estar vacía." })
  path?: string;

  @IsNumber({}, { message: "El orden de la foto debe ser un número." })
  @IsNotEmpty({ message: "Indica el orden de la foto." })
  @Min(0, { message: "El orden de la foto no puede ser negativo." })
  @Max(100, { message: "El orden de la foto no puede ser mayor a 100." })
  order: number;
}
