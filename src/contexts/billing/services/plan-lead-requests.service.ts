import {
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { User } from "@/src/contexts/users/entities/user.entity";

import { TypeOrmPlanLeadRequestRepository } from "@/src/contexts/billing/repositories/typeorm.plan-lead-request-repository";
import { PlanLeadRequestNotificationMailService } from "../services/plan-lead-request-notification-mail.service";
import { CreatePlanLeadRequestHttpDto } from "../api/public/create-plan-lead-request/create-plan-lead-request.http-dto";
import {
  CreatePlanLeadProposalHttpDto,
  UpdatePlanLeadRequestHttpDto,
} from "../api/admin/plan-lead-requests/update-plan-lead-request.http-dto";
import { PLAN_LEAD_STATUS, PRICE_INTERVAL } from "../types/billing.enums";
import { SubscriptionPlanEntity } from "../entities/subscription-plan.entity";
import { PlanLeadRequestEntity } from "../entities/plan-lead-request.entity";
import { StripeClient } from "../clients/stripe.client";
import { PlanVersionsService } from "./plan-versions.service";
import { EntitlementValue } from "../types/entitlement-features";

@Injectable()
export class PlanLeadRequestsService {
  constructor(
    private readonly plan_lead_request_repository: TypeOrmPlanLeadRequestRepository,
    private readonly plan_lead_request_notification_mail_service: PlanLeadRequestNotificationMailService,
    private readonly stripe_client: StripeClient,
    private readonly plan_versions_service: PlanVersionsService,
    @InjectRepository(User)
    private readonly user_repository: Repository<User>,
    @InjectRepository(SubscriptionPlanEntity)
    private readonly plan_repository: Repository<SubscriptionPlanEntity>,
  ) {}

  async create(dto: CreatePlanLeadRequestHttpDto) {
    const saved = await this.plan_lead_request_repository.save({
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      cars_quantity: dto.cars_quantity,
      message: dto.message ?? null,
      status: PLAN_LEAD_STATUS.PENDING,
    });

    const staff_emails = await this.findStaffEmails();

    if (staff_emails.length > 0) {
      await this.plan_lead_request_notification_mail_service.notifyStaff({
        recipients: staff_emails,
        lead: {
          name: saved.name,
          email: saved.email,
          phone: saved.phone,
          cars_quantity: saved.cars_quantity,
          message: saved.message,
        },
        created_at: saved.created_at.toISOString(),
      });
    }

    return saved;
  }

  findAll(params: { page: number; limit: number }) {
    return this.plan_lead_request_repository.findAllPaginated(params);
  }

  async findOne(id: string) {
    return this.plan_lead_request_repository.findByIdOrFail(id);
  }

  async update(id: string, dto: UpdatePlanLeadRequestHttpDto) {
    const lead = await this.plan_lead_request_repository.findByIdOrFail(id);
    const updated = await this.plan_lead_request_repository.preloadAndSave({
      id: lead.id,
      status: dto.status ?? lead.status,
      base_plan_id:
        dto.base_plan_id !== undefined ? dto.base_plan_id : lead.base_plan_id,
      proposed_price_cents:
        dto.proposed_price_cents !== undefined
          ? dto.proposed_price_cents
          : lead.proposed_price_cents,
      proposed_interval:
        dto.proposed_interval !== undefined
          ? dto.proposed_interval
          : lead.proposed_interval,
      proposal_notes:
        dto.proposal_notes !== undefined
          ? dto.proposal_notes
          : lead.proposal_notes,
      proposed_overrides:
        dto.proposed_overrides !== undefined
          ? dto.proposed_overrides.map((item) => ({
              feature: item.feature,
              value_type: item.value_type,
              value: item.value as unknown as EntitlementValue,
            }))
          : lead.proposed_overrides,
    });

    return updated;
  }

  async createProposal(id: string, dto: CreatePlanLeadProposalHttpDto) {
    const lead = await this.plan_lead_request_repository.findByIdOrFail(id);
    const plan = await this.plan_repository.findOne({
      where: { id: dto.base_plan_id },
    });
    if (!plan) {
      throw new NotFoundException("Plan base no encontrado");
    }
    if (!plan.stripe_product_id) {
      throw new BadRequestException(
        "El plan base debe estar sincronizado con Stripe antes de crear la propuesta",
      );
    }
    if (
      dto.proposed_interval !== PRICE_INTERVAL.MONTH &&
      dto.proposed_interval !== PRICE_INTERVAL.YEAR
    ) {
      throw new BadRequestException("El intervalo debe ser month o year");
    }

    const published = await this.plan_versions_service.findPublishedByPlanId(
      plan.id,
    );
    if (!published) {
      throw new BadRequestException(
        "El plan base no tiene una versión publicada",
      );
    }

    const stripe_price_id = await this.stripe_client.createOrUpdatePrice({
      stripe_product_id: plan.stripe_product_id,
      amount_cents: dto.proposed_price_cents,
      currency: "eur",
      interval: dto.proposed_interval,
      billing_type: plan.billing_type,
    });

    const updated = await this.plan_lead_request_repository.preloadAndSave({
      id: lead.id,
      status: PLAN_LEAD_STATUS.PROPOSAL_SENT,
      base_plan_id: dto.base_plan_id,
      proposed_price_cents: dto.proposed_price_cents,
      proposed_interval: dto.proposed_interval,
      proposed_stripe_price_id: stripe_price_id,
      proposal_notes: dto.proposal_notes ?? null,
      proposed_overrides:
        dto.proposed_overrides?.map((item) => ({
          feature: item.feature,
          value_type: item.value_type,
          value: item.value as unknown as EntitlementValue,
        })) ?? null,
    });

    const checkout_url =
      await this.stripe_client.createGuestSubscriptionCheckout({
        stripe_price_id,
        plan_id: plan.id,
        plan_price_id: `lead-${lead.id}`,
        plan_version_id: published.id,
        lead_request_id: lead.id,
        customer_email: lead.email,
      });

    await this.plan_lead_request_notification_mail_service.notifyProposal({
      to: lead.email,
      lead_name: lead.name,
      plan_name: plan.name,
      checkout_url,
      notes: dto.proposal_notes ?? null,
    });

    return {
      ...updated,
      checkout_url,
    };
  }

  async markAccepted(id: string) {
    const lead = await this.plan_lead_request_repository.findByIdOrFail(id);
    return this.plan_lead_request_repository.preloadAndSave({
      id: lead.id,
      status: PLAN_LEAD_STATUS.ACCEPTED,
    });
  }

  async findById(id: string): Promise<PlanLeadRequestEntity | null> {
    return this.plan_lead_request_repository.findById(id);
  }

  private async findStaffEmails(): Promise<string[]> {
    const users = await this.user_repository
      .createQueryBuilder("user")
      .where("user.is_admin = :is_admin", { is_admin: true })
      .select(["user.email"])
      .getMany();

    return [
      ...new Set(
        users
          .map((user) => user.email.trim())
          .filter((email) => email.length > 0),
      ),
    ];
  }
}
