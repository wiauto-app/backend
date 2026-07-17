import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { TractionEntity } from "../entities/traction.entity";
import { TractionsController } from "../api/tractions-v1/tractions.controller";
import { TractionsService } from "../services/tractions.service";

@Module({
  controllers: [TractionsController],
  imports: [TypeOrmModule.forFeature([TractionEntity])],
  providers: [TractionsService],
  exports: [TractionsService],
})
export class TractionsModule {}
