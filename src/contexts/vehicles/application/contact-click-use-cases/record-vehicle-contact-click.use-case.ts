import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { ValidationException } from "@/src/contexts/shared/exceptions/validation.exception";

import {
  CONTACT_CLICK_TYPE,
  ContactClick,
} from "../../domain/entities/contact-click";
import { STATUS_VEHICLE } from "../../domain/entities/vehicle";
import { VehicleNotFoundException } from "../../domain/exceptions/vehicle-not-found.exception";
import { ContactClickRepository } from "../../domain/repositories/contact-click.repository";
import { VehicleRepository } from "../../domain/repositories/vehicle.repository";
import { formatVehicleDisplayName } from "../../domain/utils/format-vehicle-display-name";
import { buildWhatsAppUrl } from "../../helpers/build-whatsapp-url";
import { RecordVehicleContactClickDto } from "./record-vehicle-contact-click.dto";

export interface RecordVehicleContactClickPhoneResult {
  phone_code: string;
  phone: string;
}

export interface RecordVehicleContactClickWhatsAppResult {
  whatsapp_url: string;
}

export type RecordVehicleContactClickResult =
  | RecordVehicleContactClickPhoneResult
  | RecordVehicleContactClickWhatsAppResult;

@Injectable()
export class RecordVehicleContactClickUseCase {
  constructor(
    private readonly vehicle_repository: VehicleRepository,
    private readonly contact_click_repository: ContactClickRepository,
  ) {}

  async execute(
    dto: RecordVehicleContactClickDto,
  ): Promise<RecordVehicleContactClickResult> {
    const vehicle = await this.vehicle_repository.findOne(dto.vehicle_id);
    if (!vehicle) {
      throw new VehicleNotFoundException(dto.vehicle_id);
    }

    if (vehicle.status !== STATUS_VEHICLE.ACTIVE) {
      throw new ValidationException("El vehículo no está disponible para consultas");
    }

    const profile_id = dto.profile_id ?? null;

    if (profile_id && profile_id === vehicle.profile_id) {
      throw new ValidationException("No puedes contactar tu propio anuncio");
    }

    if (vehicle.show_phone === false) {
      throw new ValidationException("El teléfono no está disponible para este anuncio");
    }

    const phone = vehicle.phone?.trim() || "";
    const phone_code = vehicle.phone_code?.trim() || "";

    if (!phone || !phone_code) {
      throw new ValidationException("El teléfono no está disponible para este anuncio");
    }

    if (dto.type === CONTACT_CLICK_TYPE.WHATSAPP && vehicle.has_whatsapp !== true) {
      throw new ValidationException("WhatsApp no está disponible para este anuncio");
    }

    const contact_click = ContactClick.create({
      vehicle_id: dto.vehicle_id,
      profile_id,
      type: dto.type,
    });

    await this.contact_click_repository.record(contact_click);

    if (dto.type === CONTACT_CLICK_TYPE.PHONE) {
      return { phone_code, phone };
    }

    const vehicle_title = formatVehicleDisplayName({
      make_name: vehicle.version.make.name,
      model_name: vehicle.version.model.name,
      version_name: vehicle.version.name,
    });

    return {
      whatsapp_url: buildWhatsAppUrl(
        phone_code,
        phone,
        `Hola, me interesa tu anuncio: ${vehicle_title}`,
      ),
    };
  }
}
