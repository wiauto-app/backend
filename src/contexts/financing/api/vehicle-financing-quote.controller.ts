import { Body, Controller, Param, ParseUUIDPipe, Post } from "@nestjs/common";

import { QuoteVehicleFinancingHttpDto } from "../dto/quote-vehicle-financing.http-dto";
import { DealershipFinancingService } from "../services/dealership-financing.service";
import { V1_VEHICLE_FINANCING_QUOTE } from "./route.constants";

@Controller(V1_VEHICLE_FINANCING_QUOTE)
export class VehicleFinancingQuoteController {
  constructor(
    private readonly dealership_financing_service: DealershipFinancingService,
  ) {}

  @Post()
  quote(
    @Param("vehicle_id", new ParseUUIDPipe()) vehicle_id: string,
    @Body() body: QuoteVehicleFinancingHttpDto,
  ) {
    return this.dealership_financing_service.quoteForVehicle(vehicle_id, body);
  }
}
