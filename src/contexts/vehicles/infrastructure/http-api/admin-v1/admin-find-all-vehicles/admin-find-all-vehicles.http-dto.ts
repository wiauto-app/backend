import { PaginationHttpDto } from "@/src/contexts/shared/infrastructure/http-dtos/pagination.http-dto";
import { IsOptional, IsString, IsEnum, IsDate, IsBoolean } from "class-validator";
import { Type } from "class-transformer";
import { StatusVehicle, PublisherType, STATUS_VEHICLE, PUBLISHER_TYPE } from "@/src/contexts/vehicles/domain/entities/vehicle";


export class AdminFindAllVehiclesHttpDto extends PaginationHttpDto {

  @IsOptional()
  @IsString()
  publisher_name?: string;

  @IsOptional()
  @IsString()
  publisher_email?: string;

  @IsOptional()
  @IsEnum(STATUS_VEHICLE)
  status?: StatusVehicle;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  since_created_at?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  until_created_at?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  since_updated_at?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  until_updated_at?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  since_expires_at?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  until_expires_at?: Date;

  @IsOptional()
  @IsBoolean()
  is_featured?: boolean;

  @IsOptional()
  @IsEnum(PUBLISHER_TYPE)
  publisher_type?: PublisherType;

  @IsOptional()
  @IsString()
  vehicle_type_id?: string;
}
