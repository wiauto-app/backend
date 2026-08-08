import { BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { PaginatedResult } from "@/src/contexts/shared/types/paginated-result.vo";
import { User } from "@/src/contexts/users/entities/user.entity";

import { ReverseGeocodingPort } from "../../ports/reverse-geocoding.port";
import { formatAddressText } from "../../services/format-vehicle-address";
import { TransmissionType } from "../../types/vehicle";
import { TypeOrmAppraisalRequestRepository } from "../repositories/typeorm.appraisal-request-repository";
import { AppraisalRequestNotFoundException } from "../exceptions/appraisal-request-not-found.exception";
import {
  APPRAISAL_REQUEST_PRIORITY,
  AppraisalRequestListItem,
  AppraisalRequestPriority,
  AppraisalRequestStatus,
} from "../types/appraisal-request";
import { AppraisalRequestNotificationMailService } from "./appraisal-request-notification-mail.service";

export interface CreateAppraisalRequestPayload {
  make_id: number;
  model_id: number;
  year_id: number;
  version_id?: number | null;
  fuel_type_id?: number | null;
  body_type_id?: number | null;
  transmission_type: TransmissionType;
  mileage: number;
  lat: number;
  lng: number;
  name: string;
  email: string;
  phone_code: string;
  phone: string;
}

export interface CreateAuthenticatedAppraisalRequestPayload
  extends CreateAppraisalRequestPayload {
  profile_id: string;
}

export interface FindAllAppraisalRequestsPayload {
  page: number;
  limit: number;
  status?: AppraisalRequestStatus;
  priority?: AppraisalRequestPriority;
}

export interface RespondAppraisalRequestPayload {
  estimated_price_min: number;
  estimated_price_max: number;
  admin_note?: string;
}

@Injectable()
export class AppraisalRequestsService {
  constructor(
    private readonly appraisal_request_repository: TypeOrmAppraisalRequestRepository,
    private readonly reverse_geocoding_port: ReverseGeocodingPort,
    private readonly appraisal_request_notification_mail_service: AppraisalRequestNotificationMailService,
    @InjectRepository(User)
    private readonly user_repository: Repository<User>,
  ) {}

  create(payload: CreateAppraisalRequestPayload): Promise<AppraisalRequestListItem> {
    return this.createInternal({
      ...payload,
      priority: APPRAISAL_REQUEST_PRIORITY.LOW,
      profile_id: null,
    });
  }

  createAuthenticated(
    payload: CreateAuthenticatedAppraisalRequestPayload,
  ): Promise<AppraisalRequestListItem> {
    return this.createInternal({
      ...payload,
      priority: APPRAISAL_REQUEST_PRIORITY.HIGH,
      profile_id: payload.profile_id,
    });
  }

  findAll(
    payload: FindAllAppraisalRequestsPayload,
  ): Promise<PaginatedResult<AppraisalRequestListItem>> {
    return this.appraisal_request_repository.findAllPaginated(payload);
  }

  async respond(
    id: string,
    payload: RespondAppraisalRequestPayload,
  ): Promise<AppraisalRequestListItem> {
    if (payload.estimated_price_max < payload.estimated_price_min) {
      throw new BadRequestException(
        "El precio máximo estimado no puede ser menor al mínimo",
      );
    }

    const existing = await this.appraisal_request_repository.findOne(id);
    if (!existing) {
      throw new AppraisalRequestNotFoundException(id);
    }

    const trimmed_note = payload.admin_note?.trim();
    const admin_note = trimmed_note && trimmed_note.length > 0 ? trimmed_note : null;
    const updated = await this.appraisal_request_repository.respond(id, {
      estimated_price_min: payload.estimated_price_min,
      estimated_price_max: payload.estimated_price_max,
      admin_note,
    });

    await this.appraisal_request_notification_mail_service.notifyCustomer({
      to: updated.email,
      name: updated.name,
      vehicle_label: updated.vehicle_label,
      estimated_price_min: updated.estimated_price_min ?? payload.estimated_price_min,
      estimated_price_max: updated.estimated_price_max ?? payload.estimated_price_max,
      admin_note: updated.admin_note,
    });

    return updated;
  }

  async close(id: string): Promise<AppraisalRequestListItem> {
    const existing = await this.appraisal_request_repository.findOne(id);
    if (!existing) {
      throw new AppraisalRequestNotFoundException(id);
    }
    return this.appraisal_request_repository.close(id);
  }

  private async createInternal(
    payload: CreateAppraisalRequestPayload & {
      priority: AppraisalRequestPriority;
      profile_id: string | null;
    },
  ): Promise<AppraisalRequestListItem> {
    const name = payload.name.trim();
    const email = payload.email.trim();
    const phone = payload.phone.trim();
    const phone_code = payload.phone_code.trim();

    if (!name) {
      throw new BadRequestException("El nombre es obligatorio");
    }
    if (!email) {
      throw new BadRequestException("El correo es obligatorio");
    }
    if (!phone || !phone_code) {
      throw new BadRequestException("El teléfono es obligatorio");
    }

    const resolved = await this.reverse_geocoding_port.resolve(payload.lat, payload.lng);
    const address = resolved ? formatAddressText(resolved.formatted_lines) : null;

    const saved = await this.appraisal_request_repository.create({
      make_id: payload.make_id,
      model_id: payload.model_id,
      year_id: payload.year_id,
      version_id: payload.version_id ?? null,
      fuel_type_id: payload.fuel_type_id ?? null,
      body_type_id: payload.body_type_id ?? null,
      transmission_type: payload.transmission_type,
      mileage: payload.mileage,
      lat: payload.lat,
      lng: payload.lng,
      address,
      name,
      email,
      phone_code,
      phone,
      priority: payload.priority,
      profile_id: payload.profile_id,
    });

    const staff_emails = await this.findStaffEmails();
    if (staff_emails.length > 0) {
      await this.appraisal_request_notification_mail_service.notifyStaff({
        recipients: staff_emails,
        appraisal: {
          vehicle_label: saved.vehicle_label,
          mileage: saved.mileage,
          name: saved.name,
          email: saved.email,
          phone_code: saved.phone_code,
          phone: saved.phone,
          address: saved.address,
        },
        created_at: saved.created_at.toISOString(),
      });
    }

    return saved;
  }

  private async findStaffEmails(): Promise<string[]> {
    const users = await this.user_repository
      .createQueryBuilder("user")
      .where("user.is_admin = :is_admin", { is_admin: true })
      .select(["user.email"])
      .getMany();

    return [
      ...new Set(
        users
          .map((user) => user.email.trim())
          .filter((email) => email.length > 0),
      ),
    ];
  }
}
