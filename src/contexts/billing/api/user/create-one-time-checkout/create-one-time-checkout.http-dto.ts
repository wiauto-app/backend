import { IsObject, IsOptional, IsString, IsUUID } from "class-validator";

export class CreateOneTimeCheckoutHttpDto {
  /** Pack de consultas del asistente */
  @IsOptional()
  @IsUUID()
  pack_id?: string;

  /** Oferta de destacar anuncio */
  @IsOptional()
  @IsUUID()
  offer_id?: string;

  /** @deprecated Preferir pack_id u offer_id */
  @IsOptional()
  @IsUUID()
  plan_price_id?: string;

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
