import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AlertsModule } from "@/src/contexts/alerts/alerts.module";
import { AuthModule } from "@/src/contexts/auth/auth.module";
import { ChatModule } from "@/src/contexts/chat/modules/chat.module";
import { User } from "@/src/contexts/users/entities/user.entity";

import { TicketsAdminController } from "../api/admin-tickets-v1/tickets-admin.controller";
import { CreateTicketController } from "../api/tickets-v1/create-ticket/create-ticket.controller";
import { DeleteTicketController } from "../api/tickets-v1/delete-ticket/delete-ticket.controller";
import { FindAllTicketsController } from "../api/tickets-v1/find-all-tickets/find-all-tickets.controller";
import { FindTicketController } from "../api/tickets-v1/find-ticket/find-ticket.controller";
import { UpdateTicketController } from "../api/tickets-v1/update-ticket/update-ticket.controller";
import { TicketEntity } from "../entities/ticket.entity";
import { TypeOrmTicketRepository } from "../repositories/typeorm.ticket-repository";
import { TicketsService } from "../services/tickets.service";
import { TicketCategoriesModule } from "./ticket-categories.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([TicketEntity, User]),
    TicketCategoriesModule,
    AuthModule,
    forwardRef(() => ChatModule),
    forwardRef(() => AlertsModule),
  ],
  controllers: [
    CreateTicketController,
    FindAllTicketsController,
    FindTicketController,
    UpdateTicketController,
    DeleteTicketController,
    TicketsAdminController,
  ],
  providers: [TicketsService, TypeOrmTicketRepository],
  exports: [TicketsService],
})
export class TicketsModule {}
