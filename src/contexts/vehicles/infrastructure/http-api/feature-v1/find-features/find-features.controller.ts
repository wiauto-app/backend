import { Controller, Get, Query } from "@nestjs/common";
import { V1_FEATURES } from "../../route.constants";
import { FindFeaturesUseCase } from "@/src/contexts/vehicles/application/features/find-features-use-case/find-features.use-case";
import { FindFeaturesHttpDto } from "./find-features.dto";

@Controller(V1_FEATURES)
export class FindFeaturesController {
  constructor(private readonly findFeaturesUseCase: FindFeaturesUseCase) {}

  @Get()
  run(@Query() findFeaturesHttpDto: FindFeaturesHttpDto) {
    return this.findFeaturesUseCase.execute(findFeaturesHttpDto);
  }
}