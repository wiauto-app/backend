
import { IsBoolean, IsNumber, IsOptional } from "class-validator";

export class SyncMakeLogosHttpDto {
  @IsOptional()
  @IsNumber()
  make_id?: number;

  @IsOptional()
  @IsBoolean()
  force?: boolean;
}
