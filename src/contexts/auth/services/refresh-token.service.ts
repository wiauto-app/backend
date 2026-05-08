import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { SuspensionService } from "../../users/services/suspension.service";
import { generateToken } from "../../shared/token_management/generate_token";
import { hashToken } from "../../shared/token_management/hash_token";
import type { User } from "../../users/entities/user.entity";
import { RefreshTokenEntity } from "../entities/refresh-token.entity";
import { SessionEntity } from "../entities/session.entity";

@Injectable()
export class RefreshTokenService {
  constructor(
    @InjectRepository(RefreshTokenEntity)
    private readonly refresh_token_repository: Repository<RefreshTokenEntity>,
    private readonly suspensionService: SuspensionService,
  ) {}

  async createForSession(user: User, session: SessionEntity): Promise<RefreshTokenEntity> {
    // await this.refresh_token_repository.update({ session_id: session.id }, { revoked: true });
    const refresh_token = this.refresh_token_repository.create({
      user_id: user.id,
      token_hash: hashToken(generateToken()),
      session_id: session.id,
      revoked: false,
      parent_id: null,
      session,
    });

    return this.refresh_token_repository.save(refresh_token);
  }

  async findByTokenHash(token_hash: string): Promise<RefreshTokenEntity> {
    const refresh_token = await this.refresh_token_repository.findOne({
      where: { token_hash },
      relations: { session: true },
    });
    if (!refresh_token) {
      throw new NotFoundException("Refresh token not found");
    }
    if (refresh_token.revoked) {
      throw new UnauthorizedException("Refresh token revoked");
    }
    if (refresh_token.session.expires_at < new Date()) {
      throw new UnauthorizedException("Session expired");
    }
    await this.suspensionService.assert_session_allowed_by_id(refresh_token.session.user_id);

    return refresh_token;
  }
}
