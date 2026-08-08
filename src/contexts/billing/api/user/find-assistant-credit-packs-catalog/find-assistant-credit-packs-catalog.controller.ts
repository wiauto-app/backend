import { Controller, Get, UseGuards } from "@nestjs/common";

import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";

import { AssistantCreditPacksService } from "../../../services/assistant-credit-packs.service";
import { V1_BILLING_ASSISTANT_CREDIT_PACKS_CATALOG } from "../../route.constants";

@Controller(V1_BILLING_ASSISTANT_CREDIT_PACKS_CATALOG)
@UseGuards(JwtGuard)
export class FindAssistantCreditPacksCatalogController {
  constructor(
    private readonly assistant_credit_packs_service: AssistantCreditPacksService,
  ) {}

  @Get()
  run() {
    return this.assistant_credit_packs_service.findCatalog();
  }
}
