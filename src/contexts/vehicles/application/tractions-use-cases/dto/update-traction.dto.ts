import { PartialType } from "@nestjs/mapped-types";
import { CreateTractionDto } from "./create-traction.dto";

export class UpdateTractionDto extends PartialType(CreateTractionDto) {}
