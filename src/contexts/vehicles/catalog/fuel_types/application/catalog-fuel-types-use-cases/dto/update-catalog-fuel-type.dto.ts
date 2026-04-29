import { PartialType } from "@nestjs/mapped-types";
import { CreateCatalogFuelTypeDto } from "./create-catalog-fuel-type.dto";

export class UpdateCatalogFuelTypeDto extends PartialType(
  CreateCatalogFuelTypeDto,
) {}
