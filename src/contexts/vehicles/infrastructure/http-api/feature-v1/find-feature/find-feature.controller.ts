import { Controller, Get, Param } from "@nestjs/common";
import { V1_FEATURES } from "../../route.constants";
import { FindFeatureUseCase } from "@/src/contexts/vehicles/application/features/find-feature-use-case/find-feature.use-case";
import { FindFeatureHttpDto } from "./find-feature.dto";

@Controller(V1_FEATURES)
export class FindFeatureController {

  constructor(private readonly findFeatureUseCase: FindFeatureUseCase) {}

  @Get(":id")
  run(@Param() findFeatureHttpDto: FindFeatureHttpDto) {
    return this.findFeatureUseCase.execute(findFeatureHttpDto);
  }
}