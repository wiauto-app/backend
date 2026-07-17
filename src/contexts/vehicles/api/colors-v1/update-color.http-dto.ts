import { PartialType } from "@nestjs/mapped-types";
import { CreateColorHttpDto } from "./dto/create-color.http-dto";

export class UpdateColorHttpDto extends PartialType(CreateColorHttpDto) {}
