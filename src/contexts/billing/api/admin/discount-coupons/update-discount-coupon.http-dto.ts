import { IsBoolean, IsOptional } from "class-validator";

export class UpdateDiscountCouponHttpDto {
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
