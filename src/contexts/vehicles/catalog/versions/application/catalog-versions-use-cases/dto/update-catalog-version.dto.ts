import { PartialType } from "@nestjs/mapped-types";
import { CreateCatalogVersionDto } from "./create-catalog-version.dto";

export class UpdateCatalogVersionDto extends PartialType(
  CreateCatalogVersionDto,
) {}
