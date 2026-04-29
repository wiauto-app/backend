import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MakeEntity } from "../infrastructure/persistence/make.entity";
import { TypeormMakeRepository } from "../infrastructure/repositories/typeorm.make-repository";
import { MakesRepository } from "../domain/repositories/makes.repository";
import { MakesController } from "../infrastructure/http-api/makes-v1/makes.controller";
import { MakesUseCase } from "../application/makes-use-cases/makes.use-case";

@Module({
  controllers: [MakesController],
  imports: [TypeOrmModule.forFeature([MakeEntity])],
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
