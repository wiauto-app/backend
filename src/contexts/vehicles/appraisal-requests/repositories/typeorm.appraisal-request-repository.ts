import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { PaginatedResult } from "@/src/contexts/shared/types/paginated-result.vo";
import { getSkip } from "@/src/contexts/shared/getSkip";

import { AppraisalRequestEntity } from "../entities/appraisal-request.entity";
import { AppraisalRequestNotFoundException } from "../exceptions/appraisal-request-not-found.exception";
import {
  AppraisalRequestListItem,
  AppraisalRequestPriority,
  AppraisalRequestStatus,
} from "../types/appraisal-request";

const RELATIONS = ["make", "model", "year", "version"];

const toNumberOrNull = (value: string | number | null): number | null =>
  value === null ? null : Number(value);

const mapEntityToListItem = (
  row: AppraisalRequestEntity,
): AppraisalRequestListItem => ({
  id: row.id,
  make_id: row.make_id,
  make_name: row.make.name,
  model_id: row.model_id,
  model_name: row.model.name,
  year_id: row.year_id,
  year: row.year.year,
  version_id: row.version_id,
  version_name: row.version?.name ?? null,
  fuel_type_id: row.fuel_type_id,
  body_type_id: row.body_type_id,
  transmission_type: row.transmission_type,
  mileage: row.mileage,
  lat: Number(row.lat),
  lng: Number(row.lng),
  address: row.address,
  vehicle_label: `${row.make.name} ${row.model.name} (${row.year.year})`,
  name: row.name,
  email: row.email,
  phone_code: row.phone_code,
  phone: row.phone,
  contact_label: `${row.name} · ${row.phone_code} ${row.phone}`,
  status: row.status,
  priority: row.priority,
  profile_id: row.profile_id,
  estimated_price_min: toNumberOrNull(row.estimated_price_min),
  estimated_price_max: toNumberOrNull(row.estimated_price_max),
  admin_note: row.admin_note,
  answered_at: row.answered_at,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

export interface CreateAppraisalRequestRow {
  make_id: number;
  model_id: number;
  year_id: number;
  version_id: number | null;
  fuel_type_id: number | null;
  body_type_id: number | null;
  transmission_type: AppraisalRequestEntity["transmission_type"];
  mileage: number;
  lat: number;
  lng: number;
  address: string | null;
  name: string;
  email: string;
  phone_code: string;
  phone: string;
  priority: AppraisalRequestPriority;
  profile_id: string | null;
}

export interface FindAllAppraisalRequestsParams {
  page: number;
  limit: number;
  status?: AppraisalRequestStatus;
  priority?: AppraisalRequestPriority;
}

export interface RespondAppraisalRequestRow {
  estimated_price_min: number;
  estimated_price_max: number;
  admin_note: string | null;
}

@Injectable()
export class TypeOrmAppraisalRequestRepository {
  constructor(
    @InjectRepository(AppraisalRequestEntity)
    private readonly appraisal_request_repository: Repository<AppraisalRequestEntity>,
  ) {}

  async create(input: CreateAppraisalRequestRow): Promise<AppraisalRequestListItem> {
    const saved = await this.appraisal_request_repository.save(input);
    return this.findOneOrFail(saved.id);
  }

  async findOne(id: string): Promise<AppraisalRequestListItem | null> {
    const row = await this.appraisal_request_repository.findOne({
      where: { id },
      relations: RELATIONS,
    });
    return row ? mapEntityToListItem(row) : null;
  }

  async findAllPaginated(
    params: FindAllAppraisalRequestsParams,
  ): Promise<PaginatedResult<AppraisalRequestListItem>> {
    const skip = getSkip(params.page, params.limit);
    const query_builder = this.appraisal_request_repository
      .createQueryBuilder("appraisal_request")
      .leftJoinAndSelect("appraisal_request.make", "make")
      .leftJoinAndSelect("appraisal_request.model", "model")
      .leftJoinAndSelect("appraisal_request.year", "year")
      .leftJoinAndSelect("appraisal_request.version", "version")
      .orderBy("appraisal_request.priority", "DESC")
      .addOrderBy("appraisal_request.created_at", "DESC")
      .skip(skip)
      .take(params.limit);

    if (params.status) {
      query_builder.andWhere("appraisal_request.status = :status", {
        status: params.status,
      });
    }

    if (params.priority) {
      query_builder.andWhere("appraisal_request.priority = :priority", {
        priority: params.priority,
      });
    }

    const [rows, total] = await query_builder.getManyAndCount();

    return new PaginatedResult(
      rows.map((row) => mapEntityToListItem(row)),
      total,
      params.page,
      params.limit,
    );
  }

  async respond(
    id: string,
    input: RespondAppraisalRequestRow,
  ): Promise<AppraisalRequestListItem> {
    const row = await this.appraisal_request_repository.preload({
      id,
      status: "answered",
      estimated_price_min: input.estimated_price_min,
      estimated_price_max: input.estimated_price_max,
      admin_note: input.admin_note,
      answered_at: new Date(),
    });
    if (!row) {
      throw new AppraisalRequestNotFoundException(id);
    }
    await this.appraisal_request_repository.save(row);
    return this.findOneOrFail(id);
  }

  async close(id: string): Promise<AppraisalRequestListItem> {
    const row = await this.appraisal_request_repository.preload({
      id,
      status: "closed",
    });
    if (!row) {
      throw new AppraisalRequestNotFoundException(id);
    }
    await this.appraisal_request_repository.save(row);
    return this.findOneOrFail(id);
  }

  private async findOneOrFail(id: string): Promise<AppraisalRequestListItem> {
    const result = await this.findOne(id);
    if (!result) {
      throw new AppraisalRequestNotFoundException(id);
    }
    return result;
  }
}
