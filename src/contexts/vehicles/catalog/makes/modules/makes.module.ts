import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MakeEntity } from "../infrastructure/persistence/make.entity";
import { TypeormMakeRepository } from "../infrastructure/repositories/typeorm.make-repository";
import { MakesRepository } from "../domain/repositories/makes.repository";
import { MakesController } from "../infrastructure/http-api/makes-v1/makes.controller";
import { MakesUseCase } from "../application/makes-use-cases/makes.use-case";
import { VehicleEntity } from "@/src/contexts/vehicles/infrastructure/persistence/vehicle.entity";

@Module({
  controllers: [MakesController],
  imports: [TypeOrmModule.forFeature([MakeEntity, VehicleEntity])],
  providers: [
    MakesUseCase,
    TypeormMakeRepository,
    {
      provide: MakesRepository,
      useExisting: TypeormMakeRepository,
    },
  ],
  exports: [MakesRepository],
})
export class MakesModule {}
