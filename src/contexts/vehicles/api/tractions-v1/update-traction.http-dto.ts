import { PartialType } from "@nestjs/mapped-types";
import { CreateTractionHttpDto } from "./dto/create-traction.http-dto";

export class UpdateTractionHttpDto extends PartialType(CreateTractionHttpDto) {}
