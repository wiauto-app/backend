import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AuthModule } from "@/src/contexts/auth/auth.module";
import { ChatModule } from "@/src/contexts/chat/modules/chat.module";
import { ProfileModule } from "@/src/contexts/profiles/profile.module";

import { CreateCallMeLeadController } from "../api/v1/leads/create-call-me-lead.controller";
import { CreateLeadController } from "../api/v1/leads/create-lead.controller";
import { LeadEntity } from "../entities/lead.entity";
import { TypeOrmLeadRepository } from "../repositories/typeorm.lead-repository";
import { LeadNotificationMailService } from "../services/lead-notification-mail.service";
import { LeadsService } from "../services/leads.service";
import { VehiclesModule } from "../vehicles.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([LeadEntity]),
    VehiclesModule,
    ChatModule,
    ProfileModule,
    AuthModule,
  ],
  controllers: [CreateLeadController, CreateCallMeLeadController],
  providers: [
    LeadsService,
    TypeOrmLeadRepository,
    LeadNotificationMailService,
  ],
  exports: [LeadsService, TypeOrmLeadRepository],
})
export class LeadsModule {}
