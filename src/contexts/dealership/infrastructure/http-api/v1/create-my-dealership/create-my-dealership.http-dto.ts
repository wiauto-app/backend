import { OmitType } from "@nestjs/mapped-types";

import { CreateDealershipHttpDto } from "../create-dealership/create-dealership.http-dto";

export class CreateMyDealershipHttpDto extends OmitType(CreateDealershipHttpDto, [
  "members",
] as const) {}
