import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AuthModule } from "@/src/contexts/auth/auth.module";
import { AssistantModule } from "@/src/contexts/assistant/assistant.module";
import { PasswordService } from "@/src/contexts/auth/services/password.service";
import { ProfileModule } from "@/src/contexts/profiles/profile.module";
import { Roles } from "@/src/contexts/roles/entities/roles.entity";
import { ProfileEntity } from "@/src/contexts/profiles/entities/profile.entity";
import { User } from "@/src/contexts/users/entities/user.entity";
import { VehicleEntity } from "@/src/contexts/vehicles/entities/vehicle.entity";
import { VehiclesModule } from "@/src/contexts/vehicles/vehicles.module";
import { VehicleSearchModule } from "@/src/contexts/vehicles/search/vehicle-search.module";

import {
  BillingPlansService,
  BillingCheckoutService,
} from "./services/billing-plans.service";
import { BillingSubscriptionProvisioningService } from "./services/billing-subscription-provisioning.service";
import { EntitlementsService } from "./services/entitlements.service";
import { PlanLeadRequestsService } from "./services/plan-lead-requests.service";
import { StripeWebhookService } from "./services/stripe-webhook.service";
import {
  TypeOrmBillingInvoiceRepository,
  TypeOrmBillingProfileRepository,
  TypeOrmOneTimePurchaseRepository,
  TypeOrmStripeWebhookEventRepository,
} from "./repositories/typeorm.billing-support-repositories";
import { TypeOrmSubscriptionPlanRepository } from "./repositories/typeorm.subscription-plan-repository";
import { TypeOrmSubscriptionRepository } from "./repositories/typeorm.subscription-repository";
import { TypeOrmPlanLeadRequestRepository } from "./repositories/typeorm.plan-lead-request-repository";
import { BillingPlansAdminController } from "./api/admin/billing-plans/billing-plans-admin.controller";
import { BillingSubscriptionsAdminController } from "./api/admin/billing-subscriptions/billing-subscriptions-admin.controller";
import { PlanLeadRequestsAdminController } from "./api/admin/plan-lead-requests/plan-lead-requests-admin.controller";
import { CreatePlanLeadRequestController } from "./api/public/create-plan-lead-request/create-plan-lead-request.controller";
import { CreatePublicSubscriptionCheckoutController } from "./api/public/create-subscription-checkout/create-public-subscription-checkout.controller";
import { FindPublicPlansCatalogController } from "./api/public/find-public-plans-catalog/find-public-plans-catalog.controller";
import { CreateBillingPortalController } from "./api/user/create-billing-portal/create-billing-portal.controller";
import { CreateOneTimeCheckoutController } from "./api/user/create-one-time-checkout/create-one-time-checkout.controller";
import { CreateSubscriptionCheckoutController } from "./api/user/create-subscription-checkout/create-subscription-checkout.controller";
import { FindBillingCatalogController } from "./api/user/find-billing-catalog/find-billing-catalog.controller";
import { FindBillingInvoicesController } from "./api/user/find-billing-invoices/find-billing-invoices.controller";
import { GetBillingMeController } from "./api/user/get-billing-me/get-billing-me.controller";
import { StripeWebhookController } from "./api/user/stripe-webhook/stripe-webhook.controller";
import { BillingInvoiceEntity } from "./entities/billing-invoice.entity";
import { OneTimePurchaseEntity } from "./entities/one-time-purchase.entity";
import { PlanFeatureEntity } from "./entities/plan-feature.entity";
import { StripeWebhookEventEntity } from "./entities/stripe-webhook-event.entity";
import { SubscriptionEntity } from "./entities/subscription.entity";
import { SubscriptionPlanPriceEntity } from "./entities/subscription-plan-price.entity";
import { SubscriptionPlanEntity } from "./entities/subscription-plan.entity";
import { PlanLeadRequestEntity } from "./entities/plan-lead-request.entity";
import { PlanLeadRequestNotificationMailService } from "./services/plan-lead-request-notification-mail.service";
import { BillingNotificationMailService } from "./services/billing-notification-mail.service";
import { StripeClient } from "./clients/stripe.client";

@Module({
  imports: [
    AuthModule,
    AssistantModule,
    ProfileModule,
    TypeOrmModule.forFeature([
      SubscriptionPlanEntity,
      SubscriptionPlanPriceEntity,
      PlanFeatureEntity,
      SubscriptionEntity,
      OneTimePurchaseEntity,
      BillingInvoiceEntity,
      StripeWebhookEventEntity,
      ProfileEntity,
      Roles,
      User,
      VehicleEntity,
      PlanLeadRequestEntity]),
    VehiclesModule,
    VehicleSearchModule],
  controllers: [
    FindPublicPlansCatalogController,
    CreatePlanLeadRequestController,
    CreatePublicSubscriptionCheckoutController,
    // Must register before BillingPlansAdminController so GET /plans/catalog
    // is not captured by GET /plans/:id (ParseUUIDPipe rejects "catalog").
    FindBillingCatalogController,
    BillingPlansAdminController,
    BillingSubscriptionsAdminController,
    PlanLeadRequestsAdminController,
    GetBillingMeController,
    CreateSubscriptionCheckoutController,
    CreateOneTimeCheckoutController,
    CreateBillingPortalController,
    FindBillingInvoicesController,
    StripeWebhookController],
  providers: [
    BillingPlansService,
    BillingCheckoutService,
    BillingSubscriptionProvisioningService,
    EntitlementsService,
    PlanLeadRequestsService,
    PlanLeadRequestNotificationMailService,
    BillingNotificationMailService,
    StripeWebhookService,
    StripeClient,
    PasswordService,
    TypeOrmSubscriptionPlanRepository,
    TypeOrmSubscriptionRepository,
    TypeOrmBillingInvoiceRepository,
    TypeOrmOneTimePurchaseRepository,
    TypeOrmStripeWebhookEventRepository,
    TypeOrmBillingProfileRepository,
    TypeOrmPlanLeadRequestRepository
  ],
  exports: [EntitlementsService, TypeOrmSubscriptionPlanRepository],
})
export class BillingModule {}
