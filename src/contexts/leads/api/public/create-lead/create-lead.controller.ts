import { Body, Controller, Post } from "@nestjs/common";

import { GenericLeadsService } from "../../../services/leads.service";
import { V1_LEADS } from "../../route.constants";
import { CreateGenericLeadHttpDto } from "./create-lead.http-dto";

@Controller(V1_LEADS)
export class CreateGenericLeadController {
  constructor(private readonly leads_service: GenericLeadsService) {}

  @Post()
  create(@Body() body: CreateGenericLeadHttpDto) {
    return this.leads_service.create(body);
  }
}
