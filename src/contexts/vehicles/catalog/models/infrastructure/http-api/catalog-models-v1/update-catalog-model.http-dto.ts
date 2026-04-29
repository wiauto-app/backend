import { PartialType } from "@nestjs/mapped-types";
import { CreateCatalogModelHttpDto } from "./dto/create-catalog-model.http-dto";

export class UpdateCatalogModelHttpDto extends PartialType(
  CreateCatalogModelHttpDto,
) {}
