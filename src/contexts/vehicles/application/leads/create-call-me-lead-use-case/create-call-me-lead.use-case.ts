import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { ValidationException } from "@/src/contexts/shared/exceptions/validation.exception";
import { ProfileRepository } from "@/src/contexts/profiles/domain/repositories/profile.repository";

import { LEAD_TYPE, Lead, PrimitiveLead } from "../../../domain/entities/lead";
import { STATUS_VEHICLE } from "../../../domain/entities/vehicle";
import { VehicleNotFoundException } from "../../../domain/exceptions/vehicle-not-found.exception";
import { LeadRepository } from "../../../domain/repositories/lead.repository";
import { VehicleRepository } from "../../../domain/repositories/vehicle.repository";
import { formatVehicleDisplayName } from "../../../domain/utils/format-vehicle-display-name";
import { LeadNotificationEmailService } from "../../ports/lead-notification-email.port";
import { CreateCallMeLeadDto } from "./create-call-me-lead.dto";

@Injectable()
export class CreateCallMeLeadUseCase {
  constructor(
    private readonly vehicle_repository: VehicleRepository,
    private readonly lead_repository: LeadRepository,
    private readonly lead_notification_email_service: LeadNotificationEmailService,
    private readonly profile_repository: ProfileRepository,
  ) {}

  async execute(
    create_call_me_lead_dto: CreateCallMeLeadDto,
  ): Promise<{ lead: PrimitiveLead; chat_id: null }> {
    const vehicle = await this.vehicle_repository.findOne(create_call_me_lead_dto.vehicle_id);
    if (!vehicle) {
      throw new VehicleNotFoundException(create_call_me_lead_dto.vehicle_id);
    }

    if (vehicle.status !== STATUS_VEHICLE.ACTIVE) {
      throw new ValidationException("El vehículo no está disponible para consultas");
    }

    const buyer_profile_id = create_call_me_lead_dto.buyer_profile_id ?? null;

    if (buyer_profile_id && buyer_profile_id === vehicle.profile_id) {
      throw new ValidationException("No puedes contactar tu propio anuncio");
    }

    const phone = create_call_me_lead_dto.phone?.trim() || null;
    const phone_code = create_call_me_lead_dto.phone_code?.trim() || null;

    if (!phone || !phone_code) {
      throw new ValidationException("El teléfono es obligatorio");
    }

    await this.validate_authenticated_name(create_call_me_lead_dto.name.trim(), buyer_profile_id);

    const callback_scheduled_at = this.parse_and_validate_callback_date(
      create_call_me_lead_dto.callback_scheduled_at,
    );

    const lead = Lead.create({
      vehicle_id: create_call_me_lead_dto.vehicle_id,
      type: LEAD_TYPE.CALL_ME,
      name: create_call_me_lead_dto.name.trim(),
      email: null,
      phone,
      phone_code,
      message: null,
      callback_scheduled_at,
      profile_id: buyer_profile_id,
    });

    await this.lead_repository.save(lead);

    const lead_primitive = lead.toPrimitives();

    await this.lead_notification_email_service.send_notification_email({
      to: vehicle.email,
      lead: lead_primitive,
      vehicle_title: formatVehicleDisplayName({
        make_name: vehicle.version.make.name,
        model_name: vehicle.version.model.name,
        version_name: vehicle.version.name,
      }),
    });

    return { lead: lead_primitive, chat_id: null };
  }

  private async validate_authenticated_name(
    name: string,
    buyer_profile_id: string | null,
  ): Promise<void> {
    if (!buyer_profile_id) {
      return;
    }

    const profile = await this.profile_repository.findOne(buyer_profile_id);
    if (!profile) {
      throw new ValidationException("Perfil de usuario no encontrado");
    }

    const profile_primitive = profile.toPrimitives();
    const profile_name = `${profile_primitive.name} ${profile_primitive.last_name ?? ""}`.trim();

    if (name !== profile_name) {
      throw new ValidationException("El nombre no coincide con tu perfil");
    }
  }

  private parse_and_validate_callback_date(callback_scheduled_at: string): Date {
    const date_match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(callback_scheduled_at.trim());
    if (!date_match) {
      throw new ValidationException("La fecha de llamada no es válida");
    }

    const year = Number(date_match[1]);
    const month = Number(date_match[2]);
    const day = Number(date_match[3]);
    const parsed_date = new Date(year, month - 1, day);

    if (
      parsed_date.getFullYear() !== year ||
      parsed_date.getMonth() !== month - 1 ||
      parsed_date.getDate() !== day
    ) {
      throw new ValidationException("La fecha de llamada no es válida");
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (parsed_date < today) {
      throw new ValidationException("La fecha de llamada debe ser hoy o una fecha futura");
    }

    return parsed_date;
  }
}
