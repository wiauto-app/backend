import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";
import { getSkip } from "@/src/contexts/shared/getSkip";
import {
  PlanLeadRequest,
  PrimitivePlanLeadRequest,
} from "../../domain/entities/plan-lead-request";
import { PlanLeadRequestRepository } from "../../domain/repositories/plan-lead-request.repository";
import { PlanLeadRequestEntity } from "../persistence/plan-lead-request.entity";

const mapEntityToPrimitive = (row: PlanLeadRequestEntity): PrimitivePlanLeadRequest => ({
  id: row.id,
  name: row.name,
  email: row.email,
  phone: row.phone,
  message: row.message,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

@Injectable()
export class TypeOrmPlanLeadRequestRepository extends PlanLeadRequestRepository {
  constructor(
    @InjectRepository(PlanLeadRequestEntity)
    private readonly plan_lead_request_repository: Repository<PlanLeadRequestEntity>,
  ) {
    super();
  }

  async save(request: PlanLeadRequest): Promise<PrimitivePlanLeadRequest> {
    const primitive = request.toPrimitives();

    const saved = await this.plan_lead_request_repository.save({
      name: primitive.name,
      email: primitive.email,
      phone: primitive.phone,
      message: primitive.message,
    });

    return mapEntityToPrimitive(saved);
  }

  async findAllPaginated(params: {
    page: number;
    limit: number;
  }): Promise<PaginatedResult<PrimitivePlanLeadRequest>> {
    const skip = getSkip(params.page, params.limit);

    const [rows, total] = await this.plan_lead_request_repository.findAndCount({
      skip,
      take: params.limit,
      order: { created_at: "DESC" },
    });

    return new PaginatedResult(
      rows.map(mapEntityToPrimitive),
      total,
      params.page,
      params.limit,
    );
  }
}
