import { InjectRepository } from "@nestjs/typeorm";
import { Injectable } from "../../shared/dependency-injectable/injectable";
import { SuspensionDurationType } from "../entities/suspension_duration_type.entity";
import { Repository } from "typeorm";
import { CreateSuspensionDurationTypeDto } from "../dto/admin/create-suspension.dto";
import { UpdateSuspensionDurationTypeDto } from "../dto/admin/update-suspension.dto";
import { NotFoundException } from "@nestjs/common";
import { userResponseConfig } from "../response.config";
import { FindAllSuspensionDurationTypesDto } from "../dto/admin/find-all-suspension.dto";
import { PaginatedResult } from "../../shared/types/paginated-result.vo";
import { FindOneSuspensionDurationTypeDto } from "../dto/admin/find-one-suspension.dto";
import { DeleteSuspensionDurationTypeDto } from "../dto/admin/delete-suspension.dto";
import { getSkip } from "../../shared/getSkip";


@Injectable()
export class AdminSuspensionService {
  constructor(
    @InjectRepository(SuspensionDurationType)
    private readonly suspensionDurationTypeRepository: Repository<SuspensionDurationType>,
  ) {}

  async create(createDurationTypeDto: CreateSuspensionDurationTypeDto): Promise<SuspensionDurationType> {
    const durationType = this.suspensionDurationTypeRepository.create(createDurationTypeDto);
    return this.suspensionDurationTypeRepository.save(durationType);
  }

  async update(updateDurationTypeDto: UpdateSuspensionDurationTypeDto): Promise<SuspensionDurationType> {
    const durationType = await this.suspensionDurationTypeRepository.preload(updateDurationTypeDto);
    if (!durationType) {
      throw new NotFoundException(userResponseConfig.messages.SUSPENSION_DURATION_TYPE_NOT_FOUND);
    }
    return this.suspensionDurationTypeRepository.save(durationType);
  }

  async delete(dto: DeleteSuspensionDurationTypeDto): Promise<void> {
    const durationType = await this.suspensionDurationTypeRepository.findOne({ where: { id: dto.id } });
    if (!durationType) {
      throw new NotFoundException(userResponseConfig.messages.SUSPENSION_DURATION_TYPE_NOT_FOUND);
    }
    await this.suspensionDurationTypeRepository.delete(durationType.id);
  }

  async findAll(dto: FindAllSuspensionDurationTypesDto): Promise<PaginatedResult<SuspensionDurationType>> {
    const skip = getSkip(dto.page, dto.limit);
    const qb = this.suspensionDurationTypeRepository.createQueryBuilder("suspension_duration_type");
    qb.skip(skip);
    qb.take(dto.limit);

    if (dto.query) {
      qb.andWhere("suspension_duration_type.label ILIKE :query", { query: `%${dto.query}%` });
    }

    if (dto.order_by) {
      qb.orderBy(`suspension_duration_type.${dto.order_by}`, dto.order_direction);
    }

    const [rows, total] = await qb.getManyAndCount();
    return new PaginatedResult(rows, total, dto.page, dto.limit);
  
  }

  async findOne(dto: FindOneSuspensionDurationTypeDto): Promise<SuspensionDurationType> {
    const durationType = await this.suspensionDurationTypeRepository.findOne({ where: { id: dto.id } });
    if (!durationType) {
      throw new NotFoundException(userResponseConfig.messages.SUSPENSION_DURATION_TYPE_NOT_FOUND);
    }
    return durationType;
  }
}