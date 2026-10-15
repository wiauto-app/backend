import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class AttributeReferralHttpDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  referral_code!: string;
}
