import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AlertsModule } from "@/src/contexts/alerts/alerts.module";
import { AuthModule } from "@/src/contexts/auth/auth.module";
import { ChatModule } from "@/src/contexts/chat/modules/chat.module";
import { DealershipInvitationModule } from "@/src/contexts/dealership/modules/dealership-invitation.module";
import { ProfileModule } from "@/src/contexts/profiles/profile.module";

import { CreateCallMeLeadController } from "../api/v1/leads/create-call-me-lead.controller";
import { CreateLeadController } from "../api/v1/leads/create-lead.controller";
import { FindSellerLeadsController } from "../api/v1/leads/find-seller-leads.controller";
import { LeadEntity } from "../entities/lead.entity";
import { TypeOrmLeadRepository } from "../repositories/typeorm.lead-repository";
import { LeadsService } from "../services/leads.service";
import { VehiclesModule } from "../vehicles.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([LeadEntity]),
    VehiclesModule,
    ChatModule,
    ProfileModule,
    DealershipInvitationModule,
    AuthModule,
    forwardRef(() => AlertsModule),
  ],
  controllers: [
    CreateLeadController,
    CreateCallMeLeadController,
    FindSellerLeadsController,
  ],
  providers: [LeadsService, TypeOrmLeadRepository],
  exports: [LeadsService, TypeOrmLeadRepository],
})
export class LeadsModule {}
