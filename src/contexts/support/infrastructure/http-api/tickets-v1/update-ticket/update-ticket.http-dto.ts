import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

import { TicketStatus } from "@/src/contexts/support/domain/entities/ticket";

export class UpdateTicketHttpDto {
  @IsOptional()
  @IsUUID("4")
  category_id?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  @IsOptional()
  @IsString()
  file_url?: string | null;

  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;
}
