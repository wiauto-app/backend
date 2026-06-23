import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AuthModule } from "@/src/contexts/auth/auth.module";
import { PasswordService } from "@/src/contexts/auth/services/password.service";
import { ProfileModule } from "@/src/contexts/profiles/profile.module";
import { Roles } from "@/src/contexts/roles/entities/roles.entity";
import { ProfileEntity } from "@/src/contexts/profiles/infrastructure/persistence/profile.entity";
import { User } from "@/src/contexts/users/entities/user.entity";
import { VehicleEntity } from "@/src/contexts/vehicles/infrastructure/persistence/vehicle.entity";
import { VehiclesModule } from "@/src/contexts/vehicles/vehicles.module";
import { VehicleSearchModule } from "@/src/contexts/vehicles/search/vehicle-search.module";

import {
  BillingPlansService,
  BillingCheckoutService,
} from "./application/services/billing-plans.service";
import { BillingSubscriptionProvisioningService } from "./application/services/billing-subscription-provisioning.service";
import { EntitlementsService } from "./application/services/entitlements.service";
import { PlanLeadRequestsService } from "./application/services/plan-lead-requests.service";
import { StripeWebhookService } from "./application/services/stripe-webhook.service";
import {
  BillingInvoiceRepository,
  BillingProfileRepository,
  OneTimePurchaseRepository,
  StripeWebhookEventRepository,
  SubscriptionPlanRepository,
  SubscriptionRepository,
} from "./domain/repositories/billing.repositories";
import { PlanLeadRequestRepository } from "./domain/repositories/plan-lead-request.repository";
import { BillingPlansAdminController } from "./infrastructure/http-api/admin/billing-plans/billing-plans-admin.controller";
import { BillingSubscriptionsAdminController } from "./infrastructure/http-api/admin/billing-subscriptions/billing-subscriptions-admin.controller";
import { PlanLeadRequestsAdminController } from "./infrastructure/http-api/admin/plan-lead-requests/plan-lead-requests-admin.controller";
import { CreatePlanLeadRequestController } from "./infrastructure/http-api/public/create-plan-lead-request/create-plan-lead-request.controller";
import { CreatePublicSubscriptionCheckoutController } from "./infrastructure/http-api/public/create-subscription-checkout/create-public-subscription-checkout.controller";
import { FindPublicPlansCatalogController } from "./infrastructure/http-api/public/find-public-plans-catalog/find-public-plans-catalog.controller";
import { CreateBillingPortalController } from "./infrastructure/http-api/user/create-billing-portal/create-billing-portal.controller";
import { CreateOneTimeCheckoutController } from "./infrastructure/http-api/user/create-one-time-checkout/create-one-time-checkout.controller";
import { CreateSubscriptionCheckoutController } from "./infrastructure/http-api/user/create-subscription-checkout/create-subscription-checkout.controller";
import { FindBillingCatalogController } from "./infrastructure/http-api/user/find-billing-catalog/find-billing-catalog.controller";
import { FindBillingInvoicesController } from "./infrastructure/http-api/user/find-billing-invoices/find-billing-invoices.controller";
import { GetBillingMeController } from "./infrastructure/http-api/user/get-billing-me/get-billing-me.controller";
import { StripeWebhookController } from "./infrastructure/http-api/user/stripe-webhook/stripe-webhook.controller";
import { BillingInvoiceEntity } from "./infrastructure/persistence/billing-invoice.entity";
import { OneTimePurchaseEntity } from "./infrastructure/persistence/one-time-purchase.entity";
import { PlanFeatureEntity } from "./infrastructure/persistence/plan-feature.entity";
import { StripeWebhookEventEntity } from "./infrastructure/persistence/stripe-webhook-event.entity";
import { SubscriptionEntity } from "./infrastructure/persistence/subscription.entity";
import { SubscriptionPlanPriceEntity } from "./infrastructure/persistence/subscription-plan-price.entity";
import { SubscriptionPlanEntity } from "./infrastructure/persistence/subscription-plan.entity";
import { PlanLeadRequestEntity } from "./infrastructure/persistence/plan-lead-request.entity";
import {
  TypeOrmBillingInvoiceRepository,
  TypeOrmBillingProfileRepository,
  TypeOrmOneTimePurchaseRepository,
  TypeOrmStripeWebhookEventRepository,
} from "./infrastructure/repositories/typeorm.billing-support-repositories";
import { TypeOrmSubscriptionPlanRepository } from "./infrastructure/repositories/typeorm.subscription-plan-repository";
import { TypeOrmSubscriptionRepository } from "./infrastructure/repositories/typeorm.subscription-repository";
import { TypeOrmPlanLeadRequestRepository } from "./infrastructure/repositories/typeorm.plan-lead-request-repository";
import { PlanLeadRequestNotificationMailService } from "./infrastructure/services/plan-lead-request-notification-mail.service";
import { BillingNotificationMailService } from "./infrastructure/services/billing-notification-mail.service";
import { StripeBillingAdapter } from "./infrastructure/stripe/stripe-billing.adapter";

@Module({
  imports: [
    AuthModule,
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
      PlanLeadRequestEntity,
    ]),
    VehiclesModule,
    VehicleSearchModule,
  ],
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
    StripeWebhookController,
  ],
  providers: [
    BillingPlansService,
    BillingCheckoutService,
    BillingSubscriptionProvisioningService,
    EntitlementsService,
    PlanLeadRequestsService,
    PlanLeadRequestNotificationMailService,
    BillingNotificationMailService,
    StripeWebhookService,
    StripeBillingAdapter,
    PasswordService,
    TypeOrmSubscriptionPlanRepository,
    TypeOrmSubscriptionRepository,
    TypeOrmBillingInvoiceRepository,
    TypeOrmOneTimePurchaseRepository,
    TypeOrmStripeWebhookEventRepository,
    TypeOrmBillingProfileRepository,
    TypeOrmPlanLeadRequestRepository,
    {
      provide: PlanLeadRequestRepository,
      useExisting: TypeOrmPlanLeadRequestRepository,
    },
    {
      provide: SubscriptionPlanRepository,
      useExisting: TypeOrmSubscriptionPlanRepository,
    },
    {
      provide: SubscriptionRepository,
      useExisting: TypeOrmSubscriptionRepository,
    },
    {
      provide: BillingInvoiceRepository,
      useExisting: TypeOrmBillingInvoiceRepository,
    },
    {
      provide: OneTimePurchaseRepository,
      useExisting: TypeOrmOneTimePurchaseRepository,
    },
    {
      provide: StripeWebhookEventRepository,
      useExisting: TypeOrmStripeWebhookEventRepository,
    },
    {
      provide: BillingProfileRepository,
      useExisting: TypeOrmBillingProfileRepository,
    },
  ],
  exports: [EntitlementsService, SubscriptionPlanRepository],
})
export class BillingModule {}
