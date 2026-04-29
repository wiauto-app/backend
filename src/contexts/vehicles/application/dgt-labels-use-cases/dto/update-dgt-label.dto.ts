import { PartialType } from "@nestjs/mapped-types";
import { CreateDgtLabelDto } from "./create-dgt-label.dto";

export class UpdateDgtLabelDto extends PartialType(CreateDgtLabelDto) {}
