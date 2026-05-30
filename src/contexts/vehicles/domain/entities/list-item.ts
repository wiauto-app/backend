import { uuidv4 } from "@/src/contexts/shared/uuid-generator/uuid-generator";

export interface PrimitiveListItem {
  id: string;
  list_id: string;
  vehicle_id: string;
  created_at: Date;
}

export class ListItem {
  constructor(private readonly primitive_list_item: PrimitiveListItem) {}

  static create({
    list_id,
    vehicle_id,
  }: {
    list_id: string;
    vehicle_id: string;
  }): ListItem {
    return new ListItem({
      id: uuidv4(),
      list_id,
      vehicle_id,
      created_at: new Date(),
    });
  }

  static fromPrimitives(primitive: PrimitiveListItem): ListItem {
    return new ListItem(primitive);
  }

  toPrimitives(): PrimitiveListItem {
    return { ...this.primitive_list_item };
  }
}
