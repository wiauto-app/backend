import { PartialType } from "@nestjs/mapped-types";
import { CreateCatalogModelDto } from "./create-catalog-model.dto";

export class UpdateCatalogModelDto extends PartialType(CreateCatalogModelDto) {}
