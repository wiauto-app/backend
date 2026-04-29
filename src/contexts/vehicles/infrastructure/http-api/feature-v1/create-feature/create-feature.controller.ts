import { Body, Controller, Post } from "@nestjs/common";
import { V1_FEATURES } from "../../route.constants";
import { CreateFeatureUseCase } from "@/src/contexts/vehicles/application/features/create-feature-use-case/create-feature.use-case";
import { CreateFeatureHttpDto } from "./create-feature.http-dto";

@Controller(V1_FEATURES)
export class CreateFeatureController {
  constructor(private readonly createFeatureUseCase: CreateFeatureUseCase) {}

  @Post()
  run(@Body() createFeatureHttpDto: CreateFeatureHttpDto) {
    return this.createFeatureUseCase.execute(createFeatureHttpDto);
  }
}