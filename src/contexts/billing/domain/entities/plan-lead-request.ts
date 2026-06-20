export type PrimitivePlanLeadRequest = {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string | null;
  created_at: Date;
  updated_at: Date;
};

export type CreatePlanLeadRequestInput = {
  name: string;
  email: string;
  phone: string;
  message?: string | null;
};

export class PlanLeadRequest {
  private constructor(private readonly props: PrimitivePlanLeadRequest) {}

  static create(input: CreatePlanLeadRequestInput): PlanLeadRequest {
    const now = new Date();

    return new PlanLeadRequest({
      id: "",
      name: input.name.trim(),
      email: input.email.trim(),
      phone: input.phone.trim(),
      message: input.message?.trim() || null,
      created_at: now,
      updated_at: now,
    });
  }

  static fromPrimitives(props: PrimitivePlanLeadRequest): PlanLeadRequest {
    return new PlanLeadRequest(props);
  }

  applyPersistedId(id: string): PlanLeadRequest {
    return new PlanLeadRequest({ ...this.props, id });
  }

  toPrimitives(): PrimitivePlanLeadRequest {
    return { ...this.props };
  }
}
