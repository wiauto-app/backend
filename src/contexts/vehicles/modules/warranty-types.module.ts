import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { WarrantyTypeEntity } from "../entities/warranty-type.entity";
import { WarrantyTypesController } from "../api/warranty-types-v1/warranty-types.controller";
import { WarrantyTypesService } from "../services/warranty-types.service";

@Module({
  controllers: [WarrantyTypesController],
  imports: [TypeOrmModule.forFeature([WarrantyTypeEntity])],
  providers: [WarrantyTypesService],
  exports: [WarrantyTypesService],
})
export class WarrantyTypesModule {}
