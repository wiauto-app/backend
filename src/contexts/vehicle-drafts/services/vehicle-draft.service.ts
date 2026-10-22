import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { QueryFailedError, Repository } from "typeorm";

import {
  VEHICLE_DRAFT_MAX_VALUES_BYTES,
  VEHICLE_DRAFT_TTL_MS,
} from "../constants/vehicle-draft.constants";
import { UpsertVehicleDraftHttpDto } from "../dto/upsert-vehicle-draft.http-dto";
import { VehicleDraftEntity } from "../entities/vehicle-draft.entity";

const isUniqueViolation = (error: unknown): boolean =>
  error instanceof QueryFailedError &&
  (error as QueryFailedError<Error & { code?: string }>).driverError.code ===
    "23505";

@Injectable()
export class VehicleDraftService {
  constructor(
    @InjectRepository(VehicleDraftEntity)
    private readonly vehicleDraftRepository: Repository<VehicleDraftEntity>,
  ) {}

  async findMine(profileId: string): Promise<VehicleDraftEntity | null> {
    const draft = await this.vehicleDraftRepository.findOneBy({
      profile_id: profileId,
    });

    if (!draft) {
      return null;
    }

    if (this.isExpired(draft)) {
      await this.vehicleDraftRepository.delete({ id: draft.id });
      return null;
    }

    return draft;
  }

  async upsertMine(
    profileId: string,
    dto: UpsertVehicleDraftHttpDto,
  ): Promise<VehicleDraftEntity> {
    this.assertValuesSize(dto.values);

    const existing = await this.vehicleDraftRepository.findOneBy({
      profile_id: profileId,
    });

    if (existing) {
      return this.updateDraft(existing.id, dto);
    }

    try {
      return await this.createDraft(profileId, dto);
    } catch (error) {
      // Dos PUT simultáneos sin fila previa: el segundo choca con el unique de profile_id.
      if (!isUniqueViolation(error)) {
        throw error;
      }

      const concurrent = await this.vehicleDraftRepository.findOneByOrFail({
        profile_id: profileId,
      });
      return this.updateDraft(concurrent.id, dto);
    }
  }

  async removeMine(profileId: string): Promise<void> {
    await this.vehicleDraftRepository.delete({ profile_id: profileId });
  }

  private createDraft(
    profileId: string,
    dto: UpsertVehicleDraftHttpDto,
  ): Promise<VehicleDraftEntity> {
    const draft = this.vehicleDraftRepository.create({
      profile_id: profileId,
      values: dto.values,
      step: dto.step ?? null,
      appraisal_id: dto.appraisal_id ?? null,
    });

    return this.vehicleDraftRepository.save(draft);
  }

  private async updateDraft(
    id: string,
    dto: UpsertVehicleDraftHttpDto,
  ): Promise<VehicleDraftEntity> {
    const draft = await this.vehicleDraftRepository.preload({
      id,
      values: dto.values,
      ...(dto.step !== undefined && { step: dto.step }),
      ...(dto.appraisal_id !== undefined && { appraisal_id: dto.appraisal_id }),
    });

    if (!draft) {
      throw new NotFoundException("No se ha encontrado el borrador");
    }

    return this.vehicleDraftRepository.save(draft);
  }

  private isExpired(draft: VehicleDraftEntity): boolean {
    return Date.now() - draft.updated_at.getTime() > VEHICLE_DRAFT_TTL_MS;
  }

  private assertValuesSize(values: Record<string, unknown>): void {
    const sizeInBytes = Buffer.byteLength(JSON.stringify(values), "utf8");

    if (sizeInBytes > VEHICLE_DRAFT_MAX_VALUES_BYTES) {
      throw new BadRequestException(
        "El borrador es demasiado grande. Reduce el texto de la descripción e inténtalo de nuevo.",
      );
    }
  }
}
