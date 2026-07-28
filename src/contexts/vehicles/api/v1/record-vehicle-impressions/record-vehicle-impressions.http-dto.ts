import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsOptional,
  IsUUID,
} from "class-validator";

const MAX_IMPRESSIONS_BATCH_SIZE = 50;

export class RecordVehicleImpressionsBodyHttpDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(MAX_IMPRESSIONS_BATCH_SIZE)
  @IsUUID("4", { each: true })
  vehicle_ids: string[];

  @IsOptional()
  @IsUUID("4")
  profile_id?: string;
}
