import { Lead } from "../entities/lead";

export abstract class LeadRepository {
  abstract save(lead: Lead): Promise<void>;
}
