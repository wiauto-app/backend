import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ServiceEntity } from "../infrastructure/persistence/service.entity";
import { TypeormServicesRepository } from "../infrastructure/repositories/typeorm.services-repository";
import { ServicesRepository } from "../domain/repositories/services.repository";
import { ServicesController } from "../infrastructure/http-api/services-v1/services.controller";
import { ServicesUseCase } from "../application/services-use-cases/services.use-case";

@Module({
  controllers: [ServicesController],
  imports: [TypeOrmModule.forFeature([ServiceEntity])],
  providers: [
    ServicesUseCase,
    TypeormServicesRepository,
    {
      provide: ServicesRepository,
      useExisting: TypeormServicesRepository,
    },
  ],
  exports: [ServicesRepository],
})
export class ServicesModule {}
