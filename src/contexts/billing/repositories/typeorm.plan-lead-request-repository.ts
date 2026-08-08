import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { NotFoundException } from "@nestjs/common";

import { PaginatedResult } from "@/src/contexts/shared/types/paginated-result.vo";
import { getSkip } from "@/src/contexts/shared/getSkip";
import { PlanLeadRequestEntity } from "../entities/plan-lead-request.entity";
import { PLAN_LEAD_STATUS } from "../types/billing.enums";

@Injectable()
export class TypeOrmPlanLeadRequestRepository {
  constructor(
    @InjectRepository(PlanLeadRequestEntity)
    private readonly plan_lead_request_repository: Repository<PlanLeadRequestEntity>,
  ) {}

  async save(
    data: Partial<PlanLeadRequestEntity> &
      Pick<
        PlanLeadRequestEntity,
        "name" | "email" | "phone" | "cars_quantity" | "message"
      >,
  ): Promise<PlanLeadRequestEntity> {
    const entity = this.plan_lead_request_repository.create({
      name: data.name,
      email: data.email,
      phone: data.phone,
      cars_quantity: data.cars_quantity,
      message: data.message,
      status: data.status ?? PLAN_LEAD_STATUS.PENDING,
      profile_id: data.profile_id ?? null,
    });

    return this.plan_lead_request_repository.save(entity);
  }

  async findById(id: string): Promise<PlanLeadRequestEntity | null> {
    return this.plan_lead_request_repository.findOne({
      where: { id },
      relations: { base_plan: true },
    });
  }

  async findByIdOrFail(id: string): Promise<PlanLeadRequestEntity> {
    const lead = await this.findById(id);
    if (!lead) {
      throw new NotFoundException("Solicitud de plan no encontrada");
    }
    return lead;
  }

  async preloadAndSave(
    data: Partial<PlanLeadRequestEntity> & { id: string },
  ): Promise<PlanLeadRequestEntity> {
    const preloaded = await this.plan_lead_request_repository.preload(data);
    if (!preloaded) {
      throw new NotFoundException("Solicitud de plan no encontrada");
    }
    return this.plan_lead_request_repository.save(preloaded);
  }

  async findAllPaginated(params: {
    page: number;
    limit: number;
  }): Promise<PaginatedResult<PlanLeadRequestEntity>> {
    const skip = getSkip(params.page, params.limit);

    const [rows, total] = await this.plan_lead_request_repository.findAndCount({
      skip,
      take: params.limit,
      order: { created_at: "DESC" },
      relations: { base_plan: true },
    });

    return new PaginatedResult(rows, total, params.page, params.limit);
  }
}
