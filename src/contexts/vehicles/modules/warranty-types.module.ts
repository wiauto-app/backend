import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { WarrantyTypeEntity } from "../infrastructure/persistence/warranty-type.entity";
import { TypeormWarrantyTypesRepository } from "../infrastructure/repositories/typeorm.warranty-types-repository";
import { WarrantyTypesRepository } from "../domain/repositories/warranty-types.repository";
import { WarrantyTypesController } from "../infrastructure/http-api/warranty-types-v1/warranty-types.controller";
import { WarrantyTypesUseCase } from "../application/warranty-types-use-cases/warranty-types.use-case";

@Module({
  controllers: [WarrantyTypesController],
  imports: [TypeOrmModule.forFeature([WarrantyTypeEntity])],
  providers: [
    WarrantyTypesUseCase,
    TypeormWarrantyTypesRepository,
    {
      provide: WarrantyTypesRepository,
      useExisting: TypeormWarrantyTypesRepository,
    },
  ],
  exports: [WarrantyTypesRepository],
})
export class WarrantyTypesModule {}
