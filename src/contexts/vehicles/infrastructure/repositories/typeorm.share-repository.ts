import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Share } from "../../domain/entities/share";
import { ShareRepository } from "../../domain/repositories/share.repository";
import { ShareEntity } from "../persistence/share.entity";

@Injectable()
export class TypeOrmShareRepository implements ShareRepository {
  constructor(
    @InjectRepository(ShareEntity)
    private readonly share_repository: Repository<ShareEntity>,
  ) {}

  async save(share: Share): Promise<void> {
    const primitive = share.toPrimitives();
    await this.share_repository.save(this.share_repository.create(primitive));
  }
}
