import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  UseGuards,
} from "@nestjs/common";

import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { DealershipOwnerGuard } from "../../../guards/dealership-owner.guard";
import { DealershipService } from "../../../services/dealership.service";
import { V1_DEALERSHIPS } from "../../route.constants";

import { FindDealershipHttpDto } from "../find-one-dealership/find-one-dealership.http-dto";

@Controller(V1_DEALERSHIPS)
export class RemoveDealershipController {
  constructor(private readonly dealership_service: DealershipService) {}

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtGuard, DealershipOwnerGuard)
  run(@Param() params: FindDealershipHttpDto) {
    return this.dealership_service.remove({ id: params.id });
  }
}
