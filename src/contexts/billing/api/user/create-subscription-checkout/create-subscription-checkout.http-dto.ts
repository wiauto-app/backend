import { IsUUID } from "class-validator";

import { BillingFiscalProfileHttpDto } from "../shared/billing-fiscal-profile.http-dto";

export class CreateSubscriptionCheckoutHttpDto extends BillingFiscalProfileHttpDto {
  @IsUUID()
  plan_price_id!: string;
}
