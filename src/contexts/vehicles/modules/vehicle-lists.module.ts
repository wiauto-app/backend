import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AuthModule } from "@/src/contexts/auth/auth.module";

import { AddVehicleListItemController } from "../api/vehicle-lists-v1/add-vehicle-list-item/add-vehicle-list-item.controller";
import { CreateVehicleListController } from "../api/vehicle-lists-v1/create-vehicle-list/create-vehicle-list.controller";
import { DeleteVehicleListController } from "../api/vehicle-lists-v1/delete-vehicle-list/delete-vehicle-list.controller";
import { FindAllVehicleListsController } from "../api/vehicle-lists-v1/find-all-vehicle-lists/find-all-vehicle-lists.controller";
import { FindVehicleListItemsController } from "../api/vehicle-lists-v1/find-vehicle-list-items/find-vehicle-list-items.controller";
import { FindVehicleListController } from "../api/vehicle-lists-v1/find-vehicle-list/find-vehicle-list.controller";
import { RemoveVehicleListItemController } from "../api/vehicle-lists-v1/remove-vehicle-list-item/remove-vehicle-list-item.controller";
import { UpdateVehicleListController } from "../api/vehicle-lists-v1/update-vehicle-list/update-vehicle-list.controller";
import { VehicleListItemEntity } from "../entities/vehicle-list-item.entity";
import { VehicleListEntity } from "../entities/vehicle-list.entity";
import { VehicleEntity } from "../entities/vehicle.entity";
import { TypeOrmVehicleListItemRepository } from "../repositories/typeorm.vehicle-list-item-repository";
import { TypeOrmVehicleListRepository } from "../repositories/typeorm.vehicle-list-repository";
import { VehicleListsService } from "../services/vehicle-lists.service";
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
    VehicleListsService,
    TypeOrmVehicleListRepository,
    TypeOrmVehicleListItemRepository,
  ],
  exports: [
    VehicleListsService,
    TypeOrmVehicleListRepository,
    TypeOrmVehicleListItemRepository,
  ],
})
export class VehicleListsModule {}
