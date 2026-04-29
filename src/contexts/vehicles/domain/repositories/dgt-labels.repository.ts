import { DgtLabel } from "../entities/dgt-label";

export abstract class DgtLabelsRepository {
  abstract findOne(id: string): Promise<DgtLabel | null>;
  abstract findAll(): Promise<DgtLabel[]>;
  abstract save(label: DgtLabel): Promise<void>;
  abstract persist_updated(label: DgtLabel): Promise<void>;
  abstract remove(id: string): Promise<void>;
}
