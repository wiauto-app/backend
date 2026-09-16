import { NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { getSkip } from "@/src/contexts/shared/getSkip";
import { PaginatedResult } from "@/src/contexts/shared/types/paginated-result.vo";

import { CreateGenericLeadHttpDto } from "../api/public/create-lead/create-lead.http-dto";
import { UpdateGenericLeadHttpDto } from "../api/admin/leads/update-lead.http-dto";
import { GenericLeadEntity } from "../entities/lead.entity";
import { InsuranceLeadNotificationService } from "./insurance-lead-notification.service";

const INSURANCE_LEAD_TYPE = "seguros";

@Injectable()
export class GenericLeadsService {
  constructor(
    @InjectRepository(GenericLeadEntity)
    private readonly lead_repository: Repository<GenericLeadEntity>,
    private readonly insurance_lead_notification_service: InsuranceLeadNotificationService,
  ) {}

  async create(dto: CreateGenericLeadHttpDto): Promise<GenericLeadEntity> {
    const entity = this.lead_repository.create({
      type: dto.type,
      first_name: dto.first_name,
      last_name: dto.last_name,
      dni: dto.dni ?? null,
      phone: dto.phone,
      email: dto.email,
      extra_data: dto.extra_data ?? {},
    });

    const saved = await this.lead_repository.save(entity);

    if (saved.type === INSURANCE_LEAD_TYPE) {
      void this.insurance_lead_notification_service.notify(saved);
    }

    return saved;
  }

  async findAll(params: {
    page: number;
    limit: number;
    type?: string;
  }): Promise<PaginatedResult<GenericLeadEntity>> {
    const skip = getSkip(params.page, params.limit);

    const [rows, total] = await this.lead_repository.findAndCount({
      skip,
      take: params.limit,
      order: { created_at: "DESC" },
      ...(params.type ? { where: { type: params.type } } : {}),
    });

    return new PaginatedResult(rows, total, params.page, params.limit);
  }

  async findOne(id: string): Promise<GenericLeadEntity> {
    const lead = await this.lead_repository.findOne({ where: { id } });

    if (!lead) {
      throw new NotFoundException("Lead no encontrado");
    }

    return lead;
  }

  async update(id: string, dto: UpdateGenericLeadHttpDto): Promise<GenericLeadEntity> {
    await this.findOne(id);

    const preloaded = await this.lead_repository.preload({
      id,
      status: dto.status,
    });

    if (!preloaded) {
      throw new NotFoundException("Lead no encontrado");
    }

    return this.lead_repository.save(preloaded);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.lead_repository.delete(id);
  }
}
