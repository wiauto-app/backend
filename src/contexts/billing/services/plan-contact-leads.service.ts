import { NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { getSkip } from "@/src/contexts/shared/getSkip";
import { PaginatedResult } from "@/src/contexts/shared/types/paginated-result.vo";

import { CreatePlanContactLeadHttpDto } from "../api/public/create-plan-contact-lead/create-plan-contact-lead.http-dto";
import { UpdatePlanContactLeadHttpDto } from "../api/admin/plan-contact-leads/update-plan-contact-lead.http-dto";
import { PlanContactLeadEntity } from "../entities/plan-contact-lead.entity";
import {
  PLAN_CONTACT_LEAD_SOURCE,
  PLAN_CONTACT_LEAD_STATUS,
} from "../types/billing.enums";

@Injectable()
export class PlanContactLeadsService {
  constructor(
    @InjectRepository(PlanContactLeadEntity)
    private readonly plan_contact_lead_repository: Repository<PlanContactLeadEntity>,
  ) {}

  async create(dto: CreatePlanContactLeadHttpDto): Promise<PlanContactLeadEntity> {
    const entity = this.plan_contact_lead_repository.create({
      phone: dto.phone,
      source: dto.source ?? PLAN_CONTACT_LEAD_SOURCE.PLANES,
      status: PLAN_CONTACT_LEAD_STATUS.PENDING,
    });

    return this.plan_contact_lead_repository.save(entity);
  }

  async findAll(params: {
    page: number;
    limit: number;
  }): Promise<PaginatedResult<PlanContactLeadEntity>> {
    const skip = getSkip(params.page, params.limit);

    const [rows, total] = await this.plan_contact_lead_repository.findAndCount({
      skip,
      take: params.limit,
      order: { created_at: "DESC" },
    });

    return new PaginatedResult(rows, total, params.page, params.limit);
  }

  async findOne(id: string): Promise<PlanContactLeadEntity> {
    const lead = await this.plan_contact_lead_repository.findOne({
      where: { id },
    });

    if (!lead) {
      throw new NotFoundException("Lead de contacto no encontrado");
    }

    return lead;
  }

  async update(
    id: string,
    dto: UpdatePlanContactLeadHttpDto,
  ): Promise<PlanContactLeadEntity> {
    await this.findOne(id);

    const preloaded = await this.plan_contact_lead_repository.preload({
      id,
      status: dto.status,
    });

    if (!preloaded) {
      throw new NotFoundException("Lead de contacto no encontrado");
    }

    return this.plan_contact_lead_repository.save(preloaded);
  }
}
