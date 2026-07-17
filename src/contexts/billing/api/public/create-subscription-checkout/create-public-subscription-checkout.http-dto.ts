import { IsUUID } from "class-validator";

export class CreatePublicSubscriptionCheckoutHttpDto {
  @IsUUID()
  plan_price_id!: string;
}
