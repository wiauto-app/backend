import {
  ArrayUnique,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  MinLength,
} from "class-validator";

export class CreateCatalogVersionHttpDto {
  @IsInt()
  @IsNotEmpty()
  make_id: number;

  @IsInt()
  @IsNotEmpty()
  model_id: number;

  @IsInt()
  @IsNotEmpty()
  body_type_id: number;

  @IsInt()
  @IsNotEmpty()
  fuel_type_id: number;

  /** Año por defecto de la versión (también se guarda en `version_year`). */
  @IsInt()
  @IsNotEmpty()
  year_id: number;

  /** Años adicionales en los que existe la versión (se añaden, no reemplazan). */
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  year_ids?: number[];

  @IsString()
  @MinLength(1)
  @IsNotEmpty()
  name: string;
}
