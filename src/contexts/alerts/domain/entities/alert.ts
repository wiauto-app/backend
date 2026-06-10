import { uuidv4 } from "@/src/contexts/shared/uuid-generator/uuid-generator";

import type { AlertFilters } from "../filters/alert-filters";

export interface PrimitiveAlert {
  id: string;
  name: string;
  created_at: Date;
  updated_at: Date;
  profile_id: string;
  email: string;
  phone: string;
  phone_code: string;
  filters: AlertFilters;
  last_sent_at: Date | null;
}

export class Alert {
  constructor(private readonly primitive_alert: PrimitiveAlert) {}

  static create(payload: {
    name: string;
    profile_id: string;
    email: string;
    phone: string;
    phone_code: string;
    filters: AlertFilters;
    last_sent_at?: Date | null;
  }): Alert {
    return new Alert({
      id: uuidv4(),
      name: payload.name,
      created_at: new Date(),
      updated_at: new Date(),
      profile_id: payload.profile_id,
      email: payload.email,
      phone: payload.phone,
      phone_code: payload.phone_code,
      filters: payload.filters,
      last_sent_at: payload.last_sent_at ?? null,
    });
  }

  update(payload: {
    name?: string;
    filters?: AlertFilters;
    last_sent_at?: Date | null;
  }): Alert {
    return new Alert({
      ...this.primitive_alert,
      ...payload,
      updated_at: new Date(),
    });
  }

  static fromPrimitives(primitive: PrimitiveAlert): Alert {
    return new Alert(primitive);
  }

  toPrimitives(): PrimitiveAlert {
    return { ...this.primitive_alert };
  }
}
