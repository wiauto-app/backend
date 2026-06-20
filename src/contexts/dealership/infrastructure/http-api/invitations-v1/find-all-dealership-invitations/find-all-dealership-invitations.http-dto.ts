import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

import { PaginationHttpDto } from "@/src/contexts/shared/infrastructure/http-dtos/pagination.http-dto";

export class FindAllDealershipInvitationsHttpDto extends PaginationHttpDto {
  @IsUUID("4")
  @IsNotEmpty()
  dealership_id: string;

  @IsOptional()
  @IsIn(["pending", "accepted", "revoked", "expired"])
  status?: "pending" | "accepted" | "revoked" | "expired";
}
