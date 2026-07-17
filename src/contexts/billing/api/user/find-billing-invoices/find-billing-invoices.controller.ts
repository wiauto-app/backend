import { Controller, Get, UseGuards } from "@nestjs/common";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";

import { TypeOrmBillingInvoiceRepository } from "@/src/contexts/billing/repositories/typeorm.billing-support-repositories";
import { V1_BILLING_INVOICES } from "../../route.constants";

@Controller(V1_BILLING_INVOICES)
@UseGuards(JwtGuard)
export class FindBillingInvoicesController {
  constructor(private readonly invoice_repository: TypeOrmBillingInvoiceRepository) {}

  @Get()
  run(@GetUserId() profile_id: string) {
    return this.invoice_repository.findByProfileId(profile_id);
  }
}
