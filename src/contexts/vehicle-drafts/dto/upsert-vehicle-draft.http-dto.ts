import { IsInt, IsObject, IsOptional, IsUUID, Min } from "class-validator";

export class UpsertVehicleDraftHttpDto {
  @IsObject({ message: "Los datos del borrador deben ser un objeto" })
  values: Record<string, unknown>;

  @IsOptional()
  @IsInt({ message: "El paso debe ser un número entero" })
  @Min(0, { message: "El paso no puede ser negativo" })
  step?: number | null;

  @IsOptional()
  @IsUUID("all", { message: "El identificador de la tasación no es válido" })
  appraisal_id?: string | null;
}
