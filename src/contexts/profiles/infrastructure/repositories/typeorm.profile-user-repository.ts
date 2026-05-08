import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { User } from "@/src/contexts/users/entities/user.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { ProfileUserRepository } from "../../domain/repositories/profile-user.repository";

@Injectable()
export class TypeOrmProfileUserRepository implements ProfileUserRepository {
  constructor(
    @InjectRepository(User)
    private readonly user_repository: Repository<User>,
  ) {}

  async exists(id: string): Promise<boolean> {
    return this.user_repository.exists({ where: { id } });
  }

  async existsByEmail(email: string): Promise<boolean> {
    return this.user_repository.exists({ where: { email } });
  }

  async findEmailById(id: string): Promise<string | null> {
    const user = await this.user_repository.findOne({
      select: { email: true },
      where: { id },
    });

    return user?.email ?? null;
  }
}
