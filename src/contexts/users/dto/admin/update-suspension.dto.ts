import { IsUUID } from "class-validator";
import { CreateSuspensionDurationTypeDto } from "./create-suspension.dto";
import { PartialType } from "@nestjs/mapped-types";


export class UpdateSuspensionDurationTypeDto extends PartialType(CreateSuspensionDurationTypeDto)   {
  @IsUUID("4")
  id: string;
}