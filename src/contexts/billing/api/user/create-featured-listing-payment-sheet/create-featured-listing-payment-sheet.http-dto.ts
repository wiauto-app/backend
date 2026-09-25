import { IsOptional, IsUUID } from "class-validator";

/**
 * Body for POST /v1/billing/featured-listing/payment-sheet.
 *
 * With `vehicle_id` the payment features that listing when the webhook
 * confirms it; without it the webhook grants a redeemable featured credit.
 */
export class CreateFeaturedListingPaymentSheetHttpDto {
  @IsUUID()
  offer_id!: string;

  @IsOptional()
  @IsUUID()
  vehicle_id?: string;
}
