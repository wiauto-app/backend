import { PartialType } from "@nestjs/mapped-types";
import { CreateWarrantyTypeDto } from "./create-warranty-type.dto";

export class UpdateWarrantyTypeDto extends PartialType(CreateWarrantyTypeDto) {}
