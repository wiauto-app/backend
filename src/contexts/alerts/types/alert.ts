import { uuidv4 } from "@/src/contexts/shared/uuid-generator/uuid-generator";

import type { AlertFilters } from "./alert-filters";

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
  is_active: boolean;
  notify_new_listings: boolean;
  notify_price_drops: boolean;
  notify_sold_removed: boolean;
  notify_featured: boolean;
  notify_recently_updated: boolean;
  last_viewed_at: Date | null;
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
    is_active?: boolean;
    notify_new_listings?: boolean;
    notify_price_drops?: boolean;
    notify_sold_removed?: boolean;
    notify_featured?: boolean;
    notify_recently_updated?: boolean;
    last_viewed_at?: Date | null;
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
      is_active: payload.is_active ?? true,
      notify_new_listings: payload.notify_new_listings ?? true,
      notify_price_drops: payload.notify_price_drops ?? true,
      notify_sold_removed: payload.notify_sold_removed ?? false,
      notify_featured: payload.notify_featured ?? false,
      notify_recently_updated: payload.notify_recently_updated ?? false,
      last_viewed_at: payload.last_viewed_at ?? null,
    });
  }

  update(payload: {
    name?: string;
    filters?: AlertFilters;
    last_sent_at?: Date | null;
    is_active?: boolean;
    notify_new_listings?: boolean;
    notify_price_drops?: boolean;
    notify_sold_removed?: boolean;
    notify_featured?: boolean;
    notify_recently_updated?: boolean;
    last_viewed_at?: Date | null;
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

export interface AlertWithNewMatchesCount extends PrimitiveAlert {
  new_matches_count: number;
}
