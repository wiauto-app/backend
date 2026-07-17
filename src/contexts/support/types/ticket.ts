import { uuidv4 } from "@/src/contexts/shared/uuid-generator/uuid-generator";
import { PrimitiveTicketCategory } from "./ticket-category";

export enum TicketStatus {
  OPEN = "open",
  CLOSED = "closed",
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  RESOLVED = "resolved",
  CANCELLED = "cancelled",
}

export interface PrimitiveTicket {
  id: string;
  title: string;
  description: string;
  file_url: string | null;
  category: PrimitiveTicketCategory;
  status: TicketStatus;
  profile_id: string;
  created_at: Date;
  updated_at: Date;
}

export class Ticket {
  constructor(private readonly primitive_ticket: PrimitiveTicket) {}

  static create(payload: {
    title: string;
    description: string;
    file_url?: string | null;
    category: PrimitiveTicketCategory;
    profile_id: string;
  }): Ticket {
    return new Ticket({
      id: uuidv4(),
      title: payload.title,
      description: payload.description,
      file_url: payload.file_url ?? null,
      category: payload.category,
      profile_id: payload.profile_id,
      status: TicketStatus.OPEN,
      created_at: new Date(),
      updated_at: new Date(),
    });
  }

  update(payload: {
    title?: string;
    description?: string;
    file_url?: string | null;
    category?: PrimitiveTicketCategory;
    status?: TicketStatus;
  }): Ticket {
    return new Ticket({
      ...this.primitive_ticket,
      ...payload,
      updated_at: new Date(),
    });
  }

  static fromPrimitives(primitive: PrimitiveTicket): Ticket {
    return new Ticket(primitive);
  }

  toPrimitives(): PrimitiveTicket {
    return {
      ...this.primitive_ticket,
    };
  }
}
