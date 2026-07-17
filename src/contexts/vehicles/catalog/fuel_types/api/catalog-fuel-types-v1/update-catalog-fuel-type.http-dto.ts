import { PartialType } from "@nestjs/mapped-types";
import { CreateCatalogFuelTypeHttpDto } from "./dto/create-catalog-fuel-type.http-dto";

export class UpdateCatalogFuelTypeHttpDto extends PartialType(
  CreateCatalogFuelTypeHttpDto,
) {}
