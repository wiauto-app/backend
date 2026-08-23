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
  @IsUUID()
  @IsOptional()
  id?: string;

  @ValidateIf((o: UpdateImageHttpDto) => !o.path)
  @IsUUID("4")
  @IsNotEmpty()
  upload_id?: string;

  @ValidateIf((o: UpdateImageHttpDto) => !o.upload_id)
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  path?: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  @Max(100)
  order: number;
}
