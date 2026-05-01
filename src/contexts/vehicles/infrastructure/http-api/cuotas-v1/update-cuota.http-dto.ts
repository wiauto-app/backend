import { PartialType } from "@nestjs/mapped-types";

import { CreateCuotaHttpDto } from "./dto/create-cuota.http-dto";

export class UpdateCuotaHttpDto extends PartialType(CreateCuotaHttpDto) {}
