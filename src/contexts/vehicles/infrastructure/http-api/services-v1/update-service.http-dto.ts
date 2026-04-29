import { PartialType } from "@nestjs/mapped-types";
import { CreateServiceHttpDto } from "./dto/create-service.http-dto";

export class UpdateServiceHttpDto extends PartialType(CreateServiceHttpDto) {}
