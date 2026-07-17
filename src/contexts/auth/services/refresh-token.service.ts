import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { MoreThan, Repository } from "typeorm";

import { SuspensionService } from "../../users/services/suspension.service";
import { generateToken } from "../../shared/token_management/generate_token";
import { hashToken } from "../../shared/token_management/hash_token";
import type { User } from "../../users/entities/user.entity";
import { RefreshTokenEntity } from "../entities/refresh-token.entity";
import { SessionEntity } from "../entities/session.entity";
import { MONTH } from "@/src/common/envs";
import { authResponseConfig } from "../response.config";

export interface CreateRefreshTokenResult {
  entity: RefreshTokenEntity;
  raw_token: string;
}

/** Ventana para reutilizar el refresh hijo tras una rotación concurrente. */
export const REFRESH_ROTATION_GRACE_MS = 30_000;

export interface GraceRotationTokens {
  raw_token: string;
  token_hash: string;
  cached_at: number;
}

@Injectable()
export class RefreshTokenService {
  /** Raw del hijo recién emitido (no se persiste en DB); solo para grace same-process. */
  private readonly recent_rotations_by_parent_id = new Map<
    string,
    GraceRotationTokens
  >();

  constructor(
    @InjectRepository(RefreshTokenEntity)
    private readonly refresh_token_repository: Repository<RefreshTokenEntity>,
    private readonly suspensionService: SuspensionService,
  ) {}

  async createForSession(
    user: User,
    session: SessionEntity,
    parent_id: string | null = null,
  ): Promise<CreateRefreshTokenResult> {
    const raw_token = generateToken();
    const refresh_token = this.refresh_token_repository.create({
      user_id: user.id,
      token_hash: hashToken(raw_token),
      session_id: session.id,
      revoked: false,
      expires_at: new Date(Date.now() + MONTH),
      parent_id,
      session,
    });

    const entity = await this.refresh_token_repository.save(refresh_token);
    return { entity, raw_token };
  }

  async findByTokenHash(token_hash: string): Promise<RefreshTokenEntity> {
    const refresh_token = await this.refresh_token_repository.findOne({
      where: { token_hash, revoked: false, expires_at: MoreThan(new Date()) },
      relations: ["session"],
    });
    if (!refresh_token) {
      throw new UnauthorizedException(authResponseConfig.messages.NOT_FOUND_TOKEN);
    }

    await this.suspensionService.assert_session_allowed_by_id(refresh_token.session.user_id);

    return refresh_token;
  }

  async findByRawToken(raw_token: string): Promise<RefreshTokenEntity> {
    return this.findByTokenHash(hashToken(raw_token));
  }

  async findRevokedByTokenHash(token_hash: string): Promise<RefreshTokenEntity | null> {
    return this.refresh_token_repository.findOne({
      where: { token_hash, revoked: true },
      relations: ["session"],
    });
  }

  /**
   * Hijo activo creado dentro de la ventana de grace (rotación reciente).
   */
  async findRecentActiveChildByParentId(
    parent_id: string,
    max_age_ms: number = REFRESH_ROTATION_GRACE_MS,
  ): Promise<RefreshTokenEntity | null> {
    const child = await this.refresh_token_repository.findOne({
      where: {
        parent_id,
        revoked: false,
        expires_at: MoreThan(new Date()),
      },
      relations: ["session"],
    });
    if (!child) {
      return null;
    }
    const age_ms = Date.now() - child.created_at.getTime();
    if (age_ms > max_age_ms) {
      return null;
    }
    return child;
  }

  rememberRotationForGrace(
    parent_id: string,
    raw_token: string,
    token_hash: string,
  ): void {
    this.recent_rotations_by_parent_id.set(parent_id, {
      raw_token,
      token_hash,
      cached_at: Date.now(),
    });
  }

  getGraceRotation(parent_id: string): GraceRotationTokens | null {
    const entry = this.recent_rotations_by_parent_id.get(parent_id);
    if (!entry) {
      return null;
    }
    if (Date.now() - entry.cached_at > REFRESH_ROTATION_GRACE_MS) {
      this.recent_rotations_by_parent_id.delete(parent_id);
      return null;
    }
    return entry;
  }

  async findBySessionId(session_id: string): Promise<RefreshTokenEntity> {
    const refresh_token = await this.refresh_token_repository.findOne({
      where: { session_id, revoked: false, expires_at: MoreThan(new Date()) },
      relations: ["session"],
    });
    if (!refresh_token) {
      throw new NotFoundException(authResponseConfig.messages.NOT_FOUND_TOKEN);
    }
    return refresh_token;
  }

  async revoke(refresh_token: RefreshTokenEntity): Promise<void> {
    const updated = await this.refresh_token_repository.preload({
      id: refresh_token.id,
      revoked: true,
    });
    if (!updated) {
      throw new NotFoundException(authResponseConfig.messages.NOT_FOUND_TOKEN);
    }
    await this.refresh_token_repository.save(updated);
  }

  async revokeBySessionId(session_id: string): Promise<void> {
    await this.refresh_token_repository.update({ session_id }, { revoked: true });
  }
}
