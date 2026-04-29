import { PartialType } from "@nestjs/mapped-types";
import { CreateCatalogVersionHttpDto } from "./dto/create-catalog-version.http-dto";

export class UpdateCatalogVersionHttpDto extends PartialType(
  CreateCatalogVersionHttpDto,
) {}
