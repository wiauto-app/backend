import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Lead } from "../types/lead";
import { LeadEntity } from "../entities/lead.entity";

@Injectable()
export class TypeOrmLeadRepository {
  constructor(
    @InjectRepository(LeadEntity)
    private readonly lead_repository: Repository<LeadEntity>,
  ) {}

  async save(lead: Lead): Promise<void> {
    const primitive = lead.toPrimitives();
    await this.lead_repository.save(this.lead_repository.create(primitive));
  }
}
