import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AuthModule } from "@/src/contexts/auth/auth.module";
import { ChatModule } from "@/src/contexts/chat/modules/chat.module";
import { ProfileModule } from "@/src/contexts/profiles/profile.module";

import { CreateLeadUseCase } from "../application/leads/create-lead-use-case/create-lead.use-case";
import { LeadNotificationEmailService } from "../application/ports/lead-notification-email.port";
import { LeadRepository } from "../domain/repositories/lead.repository";
import { CreateLeadController } from "../infrastructure/http-api/v1/leads/create-lead.controller";
import { LeadEntity } from "../infrastructure/persistence/lead.entity";
import { TypeOrmLeadRepository } from "../infrastructure/repositories/typeorm.lead-repository";
import { LeadNotificationMailService } from "../infrastructure/services/lead-notification-mail.service";
import { VehiclesModule } from "../vehicles.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([LeadEntity]),
    VehiclesModule,
    ChatModule,
    ProfileModule,
    AuthModule,
  ],
  controllers: [CreateLeadController],
  providers: [
    CreateLeadUseCase,
    TypeOrmLeadRepository,
    LeadNotificationMailService,
    {
      provide: LeadRepository,
      useExisting: TypeOrmLeadRepository,
    },
    {
      provide: LeadNotificationEmailService,
      useExisting: LeadNotificationMailService,
    },
  ],
  exports: [LeadRepository, CreateLeadUseCase],
})
export class LeadsModule {}
