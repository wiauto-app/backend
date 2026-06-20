import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";

import { PlanLeadRequest, PrimitivePlanLeadRequest } from "../entities/plan-lead-request";

export abstract class PlanLeadRequestRepository {
  abstract save(request: PlanLeadRequest): Promise<PrimitivePlanLeadRequest>;

  abstract findAllPaginated(params: {
    page: number;
    limit: number;
  }): Promise<PaginatedResult<PrimitivePlanLeadRequest>>;
}
