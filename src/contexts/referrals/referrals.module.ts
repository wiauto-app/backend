import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { BillingModule } from "@/src/contexts/billing/billing.module";
import { ProfileEntity } from "@/src/contexts/profiles/entities/profile.entity";
import { MailModule } from "@/src/contexts/shared/mail/mail.module";
import { User } from "@/src/contexts/users/entities/user.entity";
import { VehicleEntity } from "@/src/contexts/vehicles/entities/vehicle.entity";

import { AttributeReferralController } from "./api/attribute-referral/attribute-referral.controller";
import { GetReferralMeController } from "./api/get-referral-me/get-referral-me.controller";
import { ReferralEntity } from "./entities/referral.entity";
import { ReferralsService } from "./services/referrals.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ReferralEntity,
      ProfileEntity,
      VehicleEntity,
      User,
    ]),
    forwardRef(() => BillingModule),
    MailModule,
  ],
  controllers: [GetReferralMeController, AttributeReferralController],
  providers: [ReferralsService],
  exports: [ReferralsService],
})
export class ReferralsModule {}
