import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ColorEntity } from "../infrastructure/persistence/color.entity";
import { TypeormColorRepository } from "../infrastructure/repositories/typeorm.color-repository";
import { ColorsRepository } from "../domain/repositories/colors.repository";
import { ColorsController } from "../infrastructure/http-api/colors-v1/colors.controller";
import { ColorsUseCase } from "../application/colors-use-cases/colors.use-case";

@Module({
  controllers: [ColorsController],
  imports: [TypeOrmModule.forFeature([ColorEntity])],
  providers: [
    ColorsUseCase,
    TypeormColorRepository,
    {
      provide: ColorsRepository,
      useExisting: TypeormColorRepository,
    },
  ],
  exports: [ColorsRepository],
})
export class ColorsModule {}
