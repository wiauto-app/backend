import { uuidv4 } from "@/src/contexts/shared/uuid-generator/uuid-generator";
import { slugify } from "@/src/contexts/shared/slugify-string/slugify";

export interface PrimitiveTicketCategory {
  id: string;
  name: string;
  slug: string;
  created_at: Date;
  updated_at: Date;
}

export class TicketCategory {
  constructor(private readonly primitive_ticket_category: PrimitiveTicketCategory) {}

  static create({ name }: { name: string }): TicketCategory {
    return new TicketCategory({
      id: uuidv4(),
      name,
      slug: slugify(name),
      created_at: new Date(),
      updated_at: new Date(),
    });
  }

  update(update_ticket_category: { name?: string }): TicketCategory {
    const previous = this.primitive_ticket_category;
    const next_name = update_ticket_category.name ?? previous.name;
    const name_changed =
      update_ticket_category.name !== undefined &&
      update_ticket_category.name !== previous.name;

    return new TicketCategory({
      ...previous,
      name: next_name,
      slug: name_changed ? slugify(next_name) : previous.slug,
      updated_at: new Date(),
    });
  }

  static fromPrimitives(primitive: PrimitiveTicketCategory): TicketCategory {
    return new TicketCategory(primitive);
  }

  toPrimitives(): PrimitiveTicketCategory {
    return {
      ...this.primitive_ticket_category,
    };
  }
}
