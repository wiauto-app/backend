import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { User } from "../entities/user.entity";
import { SuspensionDurationType } from "../entities/suspension_duration_type.entity";
import { SuspendUserBodyDto } from "../dto/suspend-user.dto";
import { UnsuspendUserBodyDto } from "../dto/admin/unsuspend-user.dto";

@Injectable()
export class SuspensionService {
  constructor(
    @InjectRepository(User)
    private readonly user_repository: Repository<User>,
    @InjectRepository(SuspensionDurationType)
    private readonly duration_type_repository: Repository<SuspensionDurationType>,
  ) {}

  async list_active_duration_types(): Promise<SuspensionDurationType[]> {
    return this.duration_type_repository.find({
      where: { is_active: true },
      order: { sort_order: "ASC", label: "ASC" },
    });
  }

  async suspend_user(
    dto: SuspendUserBodyDto,
    actor_id: string,
  ): Promise<User> {
    if (actor_id === dto.target_user_id) {
      throw new ForbiddenException("No podés suspenderte a tí mismo");
    }

    const duration_type = await this.duration_type_repository.findOne({
      where: { id: dto.suspension_duration_type_id },
    });
    if (!duration_type) {
      throw new BadRequestException("Tipo de duración de suspensión no válido");
    }
    if (!duration_type.is_active) {
      throw new BadRequestException("Ese tipo de duración está desactivado");
    }

    const now = new Date();
    let suspension_end_time: Date | null = null;
    if (duration_type.duration_ms !== null) {
      const ms = Number(duration_type.duration_ms);
      if (!Number.isFinite(ms) || ms < 0) {
        throw new BadRequestException("La duración configurada es inválida");
      }
      suspension_end_time = new Date(now.getTime() + ms);
    }

    const userToSuspend = await this.user_repository.preload({
      id: dto.target_user_id,
      is_suspended: true,
      suspended_at: now,
      suspension_reason: dto.suspension_reason,
      suspension_end_time,
      suspension_duration_type: { id: duration_type.id } as SuspensionDurationType,
    });
    if (!userToSuspend) {
      throw new NotFoundException("Usuario no encontrado");
    }
    if(userToSuspend.is_suspended) {
      throw new ConflictException("El usuario ya está suspendido");
    }
    await this.user_repository.save(userToSuspend);
    return userToSuspend;
  }

  async unsuspend_user(dto: UnsuspendUserBodyDto): Promise<User> {
    const merged = await this.user_repository.preload({
      id: dto.target_user_id,
      is_suspended: false,
      suspended_at: null,
      suspension_reason: null,
      suspension_end_time: null,
      suspension_duration_type_id: null,
    });
    if (!merged) {
      throw new NotFoundException("Usuario no encontrado");
    }
    await this.user_repository.save(merged);
    return merged;
  }

  /**
   * Llamar en login y al validar JWT: levanta suspensiones vencidas y bloquea las vigentes o indefinidas.
   */
  async assert_session_allowed_by_id(user_id: string): Promise<void> {
    const user = await this.user_repository.findOne({ where: { id: user_id } });
    if (!user) {
      throw new NotFoundException("Usuario no encontrado");
    }
    await this.apply_suspension_policy_for_user(user);
  }

  private async apply_suspension_policy_for_user(user: User): Promise<void> {
    if (!user.is_suspended) {
      return;
    }
    const now = new Date();
    if (user.suspension_end_time !== null && now >= user.suspension_end_time) {
      await this.clear_suspension_for_user_id(user.id);
      return;
    }
    if (user.suspension_end_time === null) {
      throw new UnauthorizedException(
        "Tu cuenta está suspendida de forma indefinida. Contactá con soporte.",
      );
    }
    throw new UnauthorizedException(
      `Tu cuenta está suspendida hasta ${user.suspension_end_time.toISOString()}. Motivo: ${user.suspension_reason ?? "no especificado"}.`,
    );
  }

  private async clear_suspension_for_user_id(user_id: string): Promise<void> {
    const merged = await this.user_repository.preload({
      id: user_id,
      is_suspended: false,
      suspended_at: null,
      suspension_reason: null,
      suspension_end_time: null,
      suspension_duration_type: null,
    });
    if (merged) {
      await this.user_repository.save(merged);
    }
  }
}
