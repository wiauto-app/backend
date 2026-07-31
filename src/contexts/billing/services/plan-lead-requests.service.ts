import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { User } from "@/src/contexts/users/entities/user.entity";

import { TypeOrmPlanLeadRequestRepository } from "@/src/contexts/billing/repositories/typeorm.plan-lead-request-repository";
import { PlanLeadRequestNotificationMailService } from "../services/plan-lead-request-notification-mail.service";
import { CreatePlanLeadRequestHttpDto } from "../api/public/create-plan-lead-request/create-plan-lead-request.http-dto";

@Injectable()
export class PlanLeadRequestsService {
  constructor(
    private readonly plan_lead_request_repository: TypeOrmPlanLeadRequestRepository,
    private readonly plan_lead_request_notification_mail_service: PlanLeadRequestNotificationMailService,
    @InjectRepository(User)
    private readonly user_repository: Repository<User>,
  ) {}

  async create(dto: CreatePlanLeadRequestHttpDto) {
    const saved = await this.plan_lead_request_repository.save({
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      cars_quantity: dto.cars_quantity,
      message: dto.message ?? null,
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
      ),
    ];
  }
}
