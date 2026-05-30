import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AuthModule } from "@/src/contexts/auth/auth.module";

import { CreateTicketUseCase } from "../application/ticket-use-cases/create-ticket-use-case/create-ticket.use-case";
import { DeleteTicketUseCase } from "../application/ticket-use-cases/delete-ticket-use-case/delete-ticket.use-case";
import { FindAllTicketsUseCase } from "../application/ticket-use-cases/find-all-tickets-use-case/find-all-tickets.use-case";
import { FindTicketUseCase } from "../application/ticket-use-cases/find-ticket-use-case/find-ticket.use-case";
import { UpdateTicketUseCase } from "../application/ticket-use-cases/update-ticket-use-case/update-ticket.use-case";
import { TicketRepository } from "../domain/repositories/ticket.repository";
import { CreateTicketController } from "../infrastructure/http-api/tickets-v1/create-ticket/create-ticket.controller";
import { DeleteTicketController } from "../infrastructure/http-api/tickets-v1/delete-ticket/delete-ticket.controller";
import { FindAllTicketsController } from "../infrastructure/http-api/tickets-v1/find-all-tickets/find-all-tickets.controller";
import { FindTicketController } from "../infrastructure/http-api/tickets-v1/find-ticket/find-ticket.controller";
import { UpdateTicketController } from "../infrastructure/http-api/tickets-v1/update-ticket/update-ticket.controller";
import { TicketEntity } from "../infrastructure/persistence/ticket.entity";
import { TypeOrmTicketRepository } from "../infrastructure/repositories/typeorm.ticket-repository";
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
  providers: [
    CreateTicketUseCase,
    UpdateTicketUseCase,
    DeleteTicketUseCase,
    FindTicketUseCase,
    FindAllTicketsUseCase,
    TypeOrmTicketRepository,
    {
      provide: TicketRepository,
      useExisting: TypeOrmTicketRepository,
    },
  ],
})
export class TicketsModule {}
