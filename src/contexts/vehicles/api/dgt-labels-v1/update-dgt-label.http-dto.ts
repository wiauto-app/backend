import { PartialType } from "@nestjs/mapped-types";
import { CreateDgtLabelHttpDto } from "./dto/create-dgt-label.http-dto";

export class UpdateDgtLabelHttpDto extends PartialType(CreateDgtLabelHttpDto) {}
