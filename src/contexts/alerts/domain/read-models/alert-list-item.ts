import { PrimitiveAlert } from "../../domain/entities/alert";

export interface AlertListItem extends PrimitiveAlert {
  new_matches_count: number;
}
