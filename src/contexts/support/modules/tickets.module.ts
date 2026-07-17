import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AuthModule } from "@/src/contexts/auth/auth.module";

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
    TypeOrmModule.forFeature([TicketEntity]),
    TicketCategoriesModule,
    AuthModule,
  ],
  controllers: [
    CreateTicketController,
    FindAllTicketsController,
    FindTicketController,
    UpdateTicketController,
    DeleteTicketController,
  ],
  providers: [TicketsService, TypeOrmTicketRepository],
  exports: [TicketsService],
})
export class TicketsModule {}
