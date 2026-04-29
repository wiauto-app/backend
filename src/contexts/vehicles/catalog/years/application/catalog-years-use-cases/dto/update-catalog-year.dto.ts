import { PartialType } from "@nestjs/mapped-types";
import { CreateCatalogYearDto } from "./create-catalog-year.dto";

export class UpdateCatalogYearDto extends PartialType(CreateCatalogYearDto) {}
