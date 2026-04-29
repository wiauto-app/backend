import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DgtLabelEntity } from "../infrastructure/persistence/dgt-label.entity";
import { TypeormDgtLabelsRepository } from "../infrastructure/repositories/typeorm.dgt-labels-repository";
import { DgtLabelsRepository } from "../domain/repositories/dgt-labels.repository";
import { DgtLabelsController } from "../infrastructure/http-api/dgt-labels-v1/dgt-labels.controller";
import { DgtLabelsUseCase } from "../application/dgt-labels-use-cases/dgt-labels.use-case";

@Module({
  controllers: [DgtLabelsController],
  imports: [TypeOrmModule.forFeature([DgtLabelEntity])],
  providers: [
    DgtLabelsUseCase,
    TypeormDgtLabelsRepository,
    {
      provide: DgtLabelsRepository,
      useExisting: TypeormDgtLabelsRepository,
    },
  ],
  exports: [DgtLabelsRepository],
})
export class DgtLabelsModule {}
