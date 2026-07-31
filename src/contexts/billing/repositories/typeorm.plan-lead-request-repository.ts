import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { PaginatedResult } from "@/src/contexts/shared/types/paginated-result.vo";
import { getSkip } from "@/src/contexts/shared/getSkip";
import { PlanLeadRequestEntity } from "../entities/plan-lead-request.entity";

@Injectable()
export class TypeOrmPlanLeadRequestRepository {
  constructor(
    @InjectRepository(PlanLeadRequestEntity)
    private readonly plan_lead_request_repository: Repository<PlanLeadRequestEntity>,
  ) {}

  async save(
    data: Pick<
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
    });

    return this.plan_lead_request_repository.save(entity);
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
    });

    return new PaginatedResult(rows, total, params.page, params.limit);
  }
}
