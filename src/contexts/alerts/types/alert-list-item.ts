import { PrimitiveAlert } from "../types/alert";

export interface AlertListItem extends PrimitiveAlert {
  new_matches_count: number;
}
