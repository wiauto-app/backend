import { PartialType } from "@nestjs/mapped-types";
import { CreateCatalogBodyTypeHttpDto } from "./dto/create-catalog-body-type.http-dto";

export class UpdateCatalogBodyTypeHttpDto extends PartialType(
  CreateCatalogBodyTypeHttpDto,
) {}
