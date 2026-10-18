import { Type } from "class-transformer";
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  ValidateNested,
} from "class-validator";

export class VehiclePublishTrackingHttpDto {
  @IsString()
  @IsNotEmpty()
  eventId: string;

  @IsOptional()
  @IsString()
  fbp?: string;

  @IsOptional()
  @IsString()
  fbc?: string;

  @IsString()
  @IsNotEmpty()
  @IsUrl({ require_protocol: true, require_tld: false })
  pageUrl: string;

  @IsBoolean()
  consent: boolean;

  @IsOptional()
  @IsString()
  vehicleDataEventId?: string;
}

export class OptionalVehiclePublishTrackingDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => VehiclePublishTrackingHttpDto)
  tracking?: VehiclePublishTrackingHttpDto;
}
