import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { QueryFailedError, Repository } from "typeorm";

import { TypeOrmProfileRepository } from "@/src/contexts/profiles/repositories/typeorm.profile-repository";

import { UserBlockEntity } from "../entities/user-block.entity";
import { ChatParticipantsBlockedException } from "../exceptions/chat-participants-blocked.exception";
import { UserBlockAlreadyExistsException } from "../exceptions/user-block-already-exists.exception";
import { UserBlockNotFoundException } from "../exceptions/user-block-not-found.exception";
import { UserBlockSelfForbiddenException } from "../exceptions/user-block-self-forbidden.exception";
import { UserBlockTargetNotFoundException } from "../exceptions/user-block-target-not-found.exception";

export interface UserBlockListItem {
  id: string;
  blocked_profile_id: string;
  created_at: Date;
}

@Injectable()
export class UserBlocksService {
  constructor(
    @InjectRepository(UserBlockEntity)
    private readonly userBlockRepository: Repository<UserBlockEntity>,
    private readonly profileRepository: TypeOrmProfileRepository,
  ) {}

  async create(
    blocker_profile_id: string,
    blocked_profile_id: string,
  ): Promise<UserBlockListItem> {
    if (blocker_profile_id === blocked_profile_id) {
      throw new UserBlockSelfForbiddenException();
    }

    const target = await this.profileRepository.findOne(blocked_profile_id);
    if (!target) {
      throw new UserBlockTargetNotFoundException();
    }

    const existing = await this.userBlockRepository.findOne({
      where: { blocker_profile_id, blocked_profile_id },
    });
    if (existing) {
      throw new UserBlockAlreadyExistsException();
    }

    try {
      const created = this.userBlockRepository.create({
        blocker_profile_id,
        blocked_profile_id,
      });
      const saved = await this.userBlockRepository.save(created);
      return this.toListItem(saved);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new UserBlockAlreadyExistsException();
      }
      throw error;
    }
  }

  async remove(
    blocker_profile_id: string,
    blocked_profile_id: string,
  ): Promise<void> {
    const existing = await this.userBlockRepository.findOne({
      where: { blocker_profile_id, blocked_profile_id },
    });
    if (!existing) {
      throw new UserBlockNotFoundException();
    }
    await this.userBlockRepository.delete(existing.id);
  }

  async findBlockedBy(blocker_profile_id: string): Promise<UserBlockListItem[]> {
    const rows = await this.userBlockRepository.find({
      where: { blocker_profile_id },
      order: { created_at: "DESC" },
    });
    return rows.map((row) => this.toListItem(row));
  }

  async areBlockedEitherDirection(
    profile_id_a: string,
    profile_id_b: string,
  ): Promise<boolean> {
    if (profile_id_a === profile_id_b) {
      return false;
    }

    const count = await this.userBlockRepository
      .createQueryBuilder("user_block")
      .where(
        `(user_block.blocker_profile_id = :profile_id_a AND user_block.blocked_profile_id = :profile_id_b)
         OR (user_block.blocker_profile_id = :profile_id_b AND user_block.blocked_profile_id = :profile_id_a)`,
        { profile_id_a, profile_id_b },
      )
      .getCount();

    return count > 0;
  }

  async findBlockedPairProfileIds(profile_id: string): Promise<string[]> {
    const rows = await this.userBlockRepository
      .createQueryBuilder("user_block")
      .where(
        "user_block.blocker_profile_id = :profile_id OR user_block.blocked_profile_id = :profile_id",
        { profile_id },
      )
      .getMany();

    const ids = new Set<string>();
    for (const row of rows) {
      if (row.blocker_profile_id !== profile_id) {
        ids.add(row.blocker_profile_id);
      }
      if (row.blocked_profile_id !== profile_id) {
        ids.add(row.blocked_profile_id);
      }
    }
    return [...ids];
  }

  async assertParticipantsNotBlocked(participant_ids: string[]): Promise<void> {
    const unique_ids = [...new Set(participant_ids)];
    for (let i = 0; i < unique_ids.length; i += 1) {
      for (let j = i + 1; j < unique_ids.length; j += 1) {
        const blocked = await this.areBlockedEitherDirection(
          unique_ids[i],
          unique_ids[j],
        );
        if (blocked) {
          throw new ChatParticipantsBlockedException();
        }
      }
    }
  }

  private toListItem(row: UserBlockEntity): UserBlockListItem {
    return {
      id: row.id,
      blocked_profile_id: row.blocked_profile_id,
      created_at: row.created_at,
    };
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      error instanceof QueryFailedError &&
      typeof error.driverError === "object" &&
      error.driverError !== null &&
      "code" in error.driverError &&
      error.driverError.code === "23505"
    );
  }
}
