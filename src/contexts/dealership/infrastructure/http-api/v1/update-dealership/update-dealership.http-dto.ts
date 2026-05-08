import { PartialType } from "@nestjs/mapped-types";

import { CreateDealershipHttpDto } from "../create-dealership/create-dealership.http-dto";

export class UpdateDealershipHttpDto extends PartialType(CreateDealershipHttpDto) {}
