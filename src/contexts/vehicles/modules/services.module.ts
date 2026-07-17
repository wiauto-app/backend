import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { ServiceEntity } from "../entities/service.entity";
import { ServicesController } from "../api/services-v1/services.controller";
import { ServicesService } from "../services/services.service";

@Module({
  controllers: [ServicesController],
  imports: [TypeOrmModule.forFeature([ServiceEntity])],
  providers: [ServicesService],
  exports: [ServicesService],
})
export class ServicesModule {}
