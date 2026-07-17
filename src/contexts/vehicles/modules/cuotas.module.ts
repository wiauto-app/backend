import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { CuotaEntity } from "../entities/cuota.entity";
import { CuotasController } from "../api/cuotas-v1/cuotas.controller";
import { CuotasService } from "../services/cuotas.service";

@Module({
  controllers: [CuotasController],
  imports: [TypeOrmModule.forFeature([CuotaEntity])],
  providers: [CuotasService],
  exports: [CuotasService],
})
export class CuotasModule {}
