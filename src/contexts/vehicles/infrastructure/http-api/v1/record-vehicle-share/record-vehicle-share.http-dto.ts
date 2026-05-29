import { IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

export class RecordVehicleShareParamsHttpDto {
  @IsUUID("4")
  vehicle_id: string;
}

export class RecordVehicleShareBodyHttpDto {
  @IsOptional()
  @IsUUID("4")
  user_id?: string;

  @IsString()
  @IsNotEmpty()
  platform: string;

  @IsString()
  @IsNotEmpty()
  source: string;
}
