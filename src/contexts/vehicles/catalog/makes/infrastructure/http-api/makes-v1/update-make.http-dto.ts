import { PartialType } from "@nestjs/mapped-types";
import { CreateMakeHttpDto } from "./dto/create-make.http-dto";

export class UpdateMakeHttpDto extends PartialType(CreateMakeHttpDto) {}
