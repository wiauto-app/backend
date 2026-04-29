import { Body, Controller, Patch } from "@nestjs/common";
import { V1_FEATURES } from "../../route.constants";
import { UpdateFeatureHttpDto } from "./update-feature.dto";
import { UpdateFeatureUseCase } from "@/src/contexts/vehicles/application/features/update-feature-use-case/update-feature.use-case";

@Controller(V1_FEATURES)
export class UpdateFeatureController {
  constructor(private readonly updateFeatureUseCase: UpdateFeatureUseCase) {}

  @Patch()
  run(@Body() updateFeatureHttpDto: UpdateFeatureHttpDto) {
    return this.updateFeatureUseCase.execute(updateFeatureHttpDto);
  }
}