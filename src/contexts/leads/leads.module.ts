import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { CatalogModule } from "@/src/contexts/vehicles/catalog/catalog.module";

import { GenericLeadEntity } from "./entities/lead.entity";
import { GenericLeadsService } from "./services/leads.service";
import { InsuranceLeadNotificationService } from "./services/insurance-lead-notification.service";
import { CreateGenericLeadController } from "./api/public/create-lead/create-lead.controller";
import { GenericLeadsAdminController } from "./api/admin/leads/leads-admin.controller";

@Module({
  imports: [TypeOrmModule.forFeature([GenericLeadEntity]), CatalogModule],
  controllers: [CreateGenericLeadController, GenericLeadsAdminController],
  providers: [GenericLeadsService, InsuranceLeadNotificationService],
  exports: [GenericLeadsService],
})
export class GenericLeadsModule {}
