import { IsUUID } from "class-validator";

export class CreateSubscriptionCheckoutHttpDto {
  @IsUUID()
  plan_price_id!: string;
}
