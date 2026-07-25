import { Type } from "class-transformer";
import { IsBoolean, IsInt, IsOptional, IsPositive } from "class-validator";

export class SyncMakeLogosHttpDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  make_id?: number;

  @IsOptional()
  @IsBoolean()
  force?: boolean;
}
