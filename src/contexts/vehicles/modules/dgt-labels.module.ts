import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { DgtLabelEntity } from "../entities/dgt-label.entity";
import { DgtLabelsController } from "../api/dgt-labels-v1/dgt-labels.controller";
import { DgtLabelsService } from "../services/dgt-labels.service";

@Module({
  controllers: [DgtLabelsController],
  imports: [TypeOrmModule.forFeature([DgtLabelEntity])],
  providers: [DgtLabelsService],
  exports: [DgtLabelsService],
})
export class DgtLabelsModule {}
