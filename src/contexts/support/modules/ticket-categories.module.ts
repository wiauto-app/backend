import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { CreateTicketCategoryController } from "../api/ticket-categories-v1/create-ticket-category/create-ticket-category.controller";
import { DeleteTicketCategoryController } from "../api/ticket-categories-v1/delete-ticket-category/delete-ticket-category.controller";
import { FindAllTicketCategoriesController } from "../api/ticket-categories-v1/find-all-ticket-categories/find-all-ticket-categories.controller";
import { FindTicketCategoryController } from "../api/ticket-categories-v1/find-ticket-category/find-ticket-category.controller";
import { UpdateTicketCategoryController } from "../api/ticket-categories-v1/update-ticket-category/update-ticket-category.controller";
import { TicketCategoryEntity } from "../entities/ticket-category.entity";
import { TicketCategoriesService } from "../services/ticket-categories.service";

@Module({
  controllers: [
    CreateTicketCategoryController,
    UpdateTicketCategoryController,
    FindTicketCategoryController,
    FindAllTicketCategoriesController,
    DeleteTicketCategoryController,
  ],
  imports: [TypeOrmModule.forFeature([TicketCategoryEntity])],
  providers: [TicketCategoriesService],
  exports: [TicketCategoriesService],
})
export class TicketCategoriesModule {}
