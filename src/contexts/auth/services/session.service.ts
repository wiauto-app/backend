import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Request } from "express";
import { Repository } from "typeorm";

import { User } from "../../users/entities/user.entity";
import { SessionEntity } from "../entities/session.entity";
import { authResponseConfig } from "../response.config";
import { normalizeUserAgent } from "../utils/normalize-user-agent";
import { MONTH } from "@/src/common/envs";

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(SessionEntity)
    private readonly session_repository: Repository<SessionEntity>,
  ) { }

  async create(user: User, request: Request): Promise<SessionEntity> {
    const session = this.session_repository.create({
      user_id: user.id,
      ip_address: request.ip ?? null,
      user_agent: normalizeUserAgent(request.headers["user-agent"] as string | undefined),
      refreshed_at: new Date(),
      expires_at: new Date(Date.now() + MONTH),
      refresh_tokens: [],
    });

    return this.session_repository.save(session);
  }

  async update(id: string, session: Partial<SessionEntity>): Promise<SessionEntity> {
    const updated = await this.session_repository.preload({
      id,
      ...session,
    });
    if (!updated) {
      throw new NotFoundException(authResponseConfig.messages.SESSION_NOT_FOUND);
    }
    return this.session_repository.save(updated);
  }

  async findOne(id: string): Promise<SessionEntity> {
    const session = await this.session_repository.findOne({
      where: { id },
    });
    if (!session) {
      throw new UnauthorizedException(authResponseConfig.messages.SESSION_NOT_FOUND);
    }
    return session;
  }

  async findActiveById(session_id: string): Promise<SessionEntity> {
    const session = await this.session_repository.findOne({
      where: { id: session_id },
    });
    if (!session) {
      throw new UnauthorizedException(authResponseConfig.messages.SESSION_NOT_FOUND);
    }
    if (session.expires_at < new Date()) {
      throw new UnauthorizedException(authResponseConfig.messages.SESSION_EXPIRED);
    }
    return session;
  }

  async delete(id: string): Promise<void> {
    await this.session_repository.delete(id);
  }
}
