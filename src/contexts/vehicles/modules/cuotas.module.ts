import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { CuotasUseCase } from "../application/cuotas-use-cases/cuotas.use-case";
import { CuotasRepository } from "../domain/repositories/cuotas.repository";
import { CuotasController } from "../infrastructure/http-api/cuotas-v1/cuotas.controller";
import { CuotaEntity } from "../infrastructure/persistence/cuota.entity";
import { TypeormCuotaRepository } from "../infrastructure/repositories/typeorm.cuota-repository";

@Module({
  controllers: [CuotasController],
  imports: [TypeOrmModule.forFeature([CuotaEntity])],
  providers: [
    CuotasUseCase,
    TypeormCuotaRepository,
    {
      provide: CuotasRepository,
      useExisting: TypeormCuotaRepository,
    },
  ],
  exports: [CuotasRepository],
})
export class CuotasModule {}
