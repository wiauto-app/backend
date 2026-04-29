import { Controller, Delete, Param } from "@nestjs/common";
import { V1_FEATURES } from "../../route.constants";
import { RemoveFeatureUseCase } from "@/src/contexts/vehicles/application/features/remove-feature-use-case/remove-feature.use-case";
import { RemoveFeatureHttpDto } from "./remove-feature.http-dto";


@Controller(V1_FEATURES)
export class RemoveFeatureController {
  constructor(private readonly removeFeatureUseCase: RemoveFeatureUseCase) {}

  @Delete(":id")
  run(@Param() removeFeatureHttpDto: RemoveFeatureHttpDto) {
    return this.removeFeatureUseCase.execute(removeFeatureHttpDto);
  }
}