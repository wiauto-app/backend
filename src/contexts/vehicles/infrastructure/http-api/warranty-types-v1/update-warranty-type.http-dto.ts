import { PartialType } from "@nestjs/mapped-types";
import { CreateWarrantyTypeHttpDto } from "./dto/create-warranty-type.http-dto";

export class UpdateWarrantyTypeHttpDto extends PartialType(
  CreateWarrantyTypeHttpDto,
) {}
