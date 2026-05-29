import { IsObject, IsOptional, IsUUID } from "class-validator";

export class RecordVehicleViewParamsHttpDto {
  @IsUUID("4")
  vehicle_id: string;
}

export class RecordVehicleViewBodyHttpDto {
  @IsOptional()
  @IsUUID("4")
  user_id?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
