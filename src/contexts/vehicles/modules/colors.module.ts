import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { ColorEntity } from "../entities/color.entity";
import { ColorsController } from "../api/colors-v1/colors.controller";
import { ColorsService } from "../services/colors.service";

@Module({
  controllers: [ColorsController],
  imports: [TypeOrmModule.forFeature([ColorEntity])],
  providers: [ColorsService],
  exports: [ColorsService],
})
export class ColorsModule {}
