import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from "class-validator";

import { TicketStatus } from "@/src/contexts/support/types/ticket";

export class FindAllTicketsHttpDto {
  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 10;

  @IsOptional()
  @IsString()
  order_by?: string;

  @IsOptional()
  @IsEnum(["ASC", "DESC"])
  order_direction: "ASC" | "DESC" = "DESC";

  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @IsOptional()
  @IsUUID("4")
  category_id?: string;
}
