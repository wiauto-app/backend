import { PartialType } from "@nestjs/mapped-types";
import { CreateCatalogBodyTypeDto } from "./create-catalog-body-type.dto";

export class UpdateCatalogBodyTypeDto extends PartialType(
  CreateCatalogBodyTypeDto,
) {}
