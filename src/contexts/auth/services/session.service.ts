import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Request } from "express";
import { IsNull, Repository } from "typeorm";

import { User } from "../../users/entities/user.entity";
import { SessionEntity } from "../entities/session.entity";

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(SessionEntity)
    private readonly session_repository: Repository<SessionEntity>,
  ) {}

  async create(user: User, request: Request): Promise<SessionEntity> {
    const session = this.session_repository.create({
      user_id: user.id,
      ip_address: request.ip ?? null,
      user_agent: request.headers["user-agent"] ?? null,
      refreshed_at: new Date(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      refresh_tokens: [],
    });

    return this.session_repository.save(session);
  }

  async findOne(id: string): Promise<SessionEntity> {
    const session = await this.session_repository.findOne({
      where: { id },
    });
    if (!session) {
      throw new NotFoundException("Session not found");
    }
    return session;
  }

  async findOneByIpAddress(ip_address: string | undefined): Promise<SessionEntity> {
    const session = await this.session_repository.findOne({
      where: { ip_address: ip_address ?? IsNull() },
    });

    if (!session) {
      throw new NotFoundException("Sesión no encontrada");
    }

    return session;
  }

  async delete(id: string): Promise<void> {
    await this.session_repository.delete(id);
  }
}
