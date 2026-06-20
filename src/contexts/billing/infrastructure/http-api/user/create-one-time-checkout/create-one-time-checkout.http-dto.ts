import { IsObject, IsOptional, IsUUID } from "class-validator";

export class CreateOneTimeCheckoutHttpDto {
  @IsUUID()
  plan_price_id!: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, string>;
}
