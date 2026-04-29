import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TractionEntity } from "../infrastructure/persistence/traction.entity";
import { TypeormTractionRepository } from "../infrastructure/repositories/typeorm.traction-repository";
import { TractionsRepository } from "../domain/repositories/tractions.repository";
import { TractionsController } from "../infrastructure/http-api/tractions-v1/tractions.controller";
import { TractionsUseCase } from "../application/tractions-use-cases/tractions.use-case";

@Module({
  controllers: [TractionsController],
  imports: [TypeOrmModule.forFeature([TractionEntity])],
  providers: [
    TractionsUseCase,
    TypeormTractionRepository,
    {
      provide: TractionsRepository,
      useExisting: TypeormTractionRepository,
    },
  ],
  exports: [TractionsRepository],
})
export class TractionsModule {}
