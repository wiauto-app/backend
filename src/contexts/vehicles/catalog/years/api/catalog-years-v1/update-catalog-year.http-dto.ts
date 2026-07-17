import { PartialType } from "@nestjs/mapped-types";
import { CreateCatalogYearHttpDto } from "./dto/create-catalog-year.http-dto";

export class UpdateCatalogYearHttpDto extends PartialType(
  CreateCatalogYearHttpDto,
) {}
