import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AuthModule } from "@/src/contexts/auth/auth.module";

import { AddVehicleListItemUseCase } from "../application/vehicle-list-use-cases/add-vehicle-list-item-use-case/add-vehicle-list-item.use-case";
import { CreateVehicleListUseCase } from "../application/vehicle-list-use-cases/create-vehicle-list-use-case/create-vehicle-list.use-case";
import { DeleteVehicleListUseCase } from "../application/vehicle-list-use-cases/delete-vehicle-list-use-case/delete-vehicle-list.use-case";
import { EnsureDefaultVehicleListUseCase } from "../application/vehicle-list-use-cases/ensure-default-vehicle-list-use-case/ensure-default-vehicle-list.use-case";
import { FindAllVehicleListsUseCase } from "../application/vehicle-list-use-cases/find-all-vehicle-lists-use-case/find-all-vehicle-lists.use-case";
import { FindVehicleListItemsUseCase } from "../application/vehicle-list-use-cases/find-vehicle-list-items-use-case/find-vehicle-list-items.use-case";
import { FindVehicleListUseCase } from "../application/vehicle-list-use-cases/find-vehicle-list-use-case/find-vehicle-list.use-case";
import { RemoveVehicleListItemUseCase } from "../application/vehicle-list-use-cases/remove-vehicle-list-item-use-case/remove-vehicle-list-item.use-case";
import { UpdateVehicleListUseCase } from "../application/vehicle-list-use-cases/update-vehicle-list-use-case/update-vehicle-list.use-case";
import { VehicleListItemRepository } from "../domain/repositories/vehicle-list-item.repository";
import { VehicleListRepository } from "../domain/repositories/vehicle-list.repository";
import { AddVehicleListItemController } from "../infrastructure/http-api/vehicle-lists-v1/add-vehicle-list-item/add-vehicle-list-item.controller";
import { CreateVehicleListController } from "../infrastructure/http-api/vehicle-lists-v1/create-vehicle-list/create-vehicle-list.controller";
import { DeleteVehicleListController } from "../infrastructure/http-api/vehicle-lists-v1/delete-vehicle-list/delete-vehicle-list.controller";
import { FindAllVehicleListsController } from "../infrastructure/http-api/vehicle-lists-v1/find-all-vehicle-lists/find-all-vehicle-lists.controller";
import { FindVehicleListItemsController } from "../infrastructure/http-api/vehicle-lists-v1/find-vehicle-list-items/find-vehicle-list-items.controller";
import { FindVehicleListController } from "../infrastructure/http-api/vehicle-lists-v1/find-vehicle-list/find-vehicle-list.controller";
import { RemoveVehicleListItemController } from "../infrastructure/http-api/vehicle-lists-v1/remove-vehicle-list-item/remove-vehicle-list-item.controller";
import { UpdateVehicleListController } from "../infrastructure/http-api/vehicle-lists-v1/update-vehicle-list/update-vehicle-list.controller";
import { VehicleListItemEntity } from "../infrastructure/persistence/vehicle-list-item.entity";
import { VehicleListEntity } from "../infrastructure/persistence/vehicle-list.entity";
import { VehicleEntity } from "../infrastructure/persistence/vehicle.entity";
import { TypeOrmVehicleListItemRepository } from "../infrastructure/repositories/typeorm.vehicle-list-item-repository";
import { TypeOrmVehicleListRepository } from "../infrastructure/repositories/typeorm.vehicle-list-repository";
import { VehiclesModule } from "../vehicles.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      VehicleListEntity,
      VehicleListItemEntity,
      VehicleEntity,
    ]),
    VehiclesModule,
    AuthModule,
  ],
  controllers: [
    CreateVehicleListController,
    FindAllVehicleListsController,
    FindVehicleListController,
    UpdateVehicleListController,
    DeleteVehicleListController,
    AddVehicleListItemController,
    RemoveVehicleListItemController,
    FindVehicleListItemsController,
  ],
  providers: [
    EnsureDefaultVehicleListUseCase,
    CreateVehicleListUseCase,
    FindAllVehicleListsUseCase,
    FindVehicleListUseCase,
    UpdateVehicleListUseCase,
    DeleteVehicleListUseCase,
    AddVehicleListItemUseCase,
    RemoveVehicleListItemUseCase,
    FindVehicleListItemsUseCase,
    TypeOrmVehicleListRepository,
    TypeOrmVehicleListItemRepository,
    {
      provide: VehicleListRepository,
      useExisting: TypeOrmVehicleListRepository,
    },
    {
      provide: VehicleListItemRepository,
      useExisting: TypeOrmVehicleListItemRepository,
    },
  ],
  exports: [VehicleListRepository, VehicleListItemRepository],
})
export class VehicleListsModule {}
