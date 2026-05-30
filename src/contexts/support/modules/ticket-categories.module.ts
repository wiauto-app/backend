import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { CreateTicketCategoryUseCase } from "../application/ticket-category-use-cases/create-ticket-category-use-case/create-ticket-category.use-case";
import { DeleteTicketCategoryUseCase } from "../application/ticket-category-use-cases/delete-ticket-category-use-case/delete-ticket-category.use-case";
import { FindAllTicketCategoriesUseCase } from "../application/ticket-category-use-cases/find-all-ticket-categories-use-case/find-all-ticket-categories.use-case";
import { FindTicketCategoryUseCase } from "../application/ticket-category-use-cases/find-ticket-category-use-case/find-ticket-category.use-case";
import { UpdateTicketCategoryUseCase } from "../application/ticket-category-use-cases/update-ticket-category-use-case/update-ticket-category.use-case";
import { TicketCategoryRepository } from "../domain/repositories/ticket-category.repository";
import { CreateTicketCategoryController } from "../infrastructure/http-api/ticket-categories-v1/create-ticket-category/create-ticket-category.controller";
import { DeleteTicketCategoryController } from "../infrastructure/http-api/ticket-categories-v1/delete-ticket-category/delete-ticket-category.controller";
import { FindAllTicketCategoriesController } from "../infrastructure/http-api/ticket-categories-v1/find-all-ticket-categories/find-all-ticket-categories.controller";
import { FindTicketCategoryController } from "../infrastructure/http-api/ticket-categories-v1/find-ticket-category/find-ticket-category.controller";
import { UpdateTicketCategoryController } from "../infrastructure/http-api/ticket-categories-v1/update-ticket-category/update-ticket-category.controller";
import { TicketCategoryEntity } from "../infrastructure/persistence/ticket-category.entity";
import { TypeOrmTicketCategoryRepository } from "../infrastructure/repositories/typeorm.ticket-category-repository";

@Module({
  controllers: [
    CreateTicketCategoryController,
    UpdateTicketCategoryController,
    FindTicketCategoryController,
    FindAllTicketCategoriesController,
    DeleteTicketCategoryController,
  ],
  imports: [TypeOrmModule.forFeature([TicketCategoryEntity])],
  providers: [
    CreateTicketCategoryUseCase,
    UpdateTicketCategoryUseCase,
    FindTicketCategoryUseCase,
    FindAllTicketCategoriesUseCase,
    DeleteTicketCategoryUseCase,
    TypeOrmTicketCategoryRepository,
    {
      provide: TicketCategoryRepository,
      useExisting: TypeOrmTicketCategoryRepository,
    },
  ],
  exports: [TicketCategoryRepository],
})
export class TicketCategoriesModule {}
