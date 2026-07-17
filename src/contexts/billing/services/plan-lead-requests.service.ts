import { BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { User } from "@/src/contexts/users/entities/user.entity";

import { PlanLeadRequest } from "../types/plan-lead-request";
import { TypeOrmPlanLeadRequestRepository } from "@/src/contexts/billing/repositories/typeorm.plan-lead-request-repository";
import { PlanLeadRequestNotificationMailService } from "../services/plan-lead-request-notification-mail.service";

export type CreatePlanLeadRequestPayload = {
  name: string;
  email: string;
  phone: string;
  message?: string | null;
};

@Injectable()
export class PlanLeadRequestsService {
  constructor(
    private readonly plan_lead_request_repository: TypeOrmPlanLeadRequestRepository,
    private readonly plan_lead_request_notification_mail_service: PlanLeadRequestNotificationMailService,
    @InjectRepository(User)
    private readonly user_repository: Repository<User>,
  ) {}

  async create(payload: CreatePlanLeadRequestPayload) {
    const name = payload.name?.trim();
    const email = payload.email?.trim();
    const phone = payload.phone?.trim();

    if (!name) {
      throw new BadRequestException("El nombre es obligatorio");
    }

    if (!email) {
      throw new BadRequestException("El correo es obligatorio");
    }

    if (!phone) {
      throw new BadRequestException("El teléfono es obligatorio");
    }

    const request = PlanLeadRequest.create({
      name,
      email,
      phone,
      message: payload.message,
    });

    const saved = await this.plan_lead_request_repository.save(request);
    const staff_emails = await this.findStaffEmails();

    if (staff_emails.length > 0) {
      await this.plan_lead_request_notification_mail_service.notifyStaff({
        recipients: staff_emails,
        lead: {
          name: saved.name,
          email: saved.email,
          phone: saved.phone,
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

  private async findStaffEmails(): Promise<string[]> {
    const users = await this.user_repository
      .createQueryBuilder("user")
      .innerJoin("user.profile", "profile")
      .innerJoin("profile.role", "role")
      .where("(role.is_admin = :is_admin OR role.is_developer = :is_developer)", {
        is_admin: true,
        is_developer: true,
      })
      .select(["user.email"])
      .getMany();

    return [
      ...new Set(
        users
          .map((user) => user.email.trim())
          .filter((email) => email.length > 0),
      )];
  }
}
