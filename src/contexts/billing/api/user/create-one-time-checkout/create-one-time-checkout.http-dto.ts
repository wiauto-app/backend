import { IsObject, IsOptional, IsString, IsUUID } from "class-validator";

export class CreateOneTimeCheckoutHttpDto {
  @IsUUID()
  plan_price_id!: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, string>;

  @IsOptional()
  @IsString()
  success_url?: string;

  @IsOptional()
  @IsString()
  cancel_url?: string;
}
