import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { ValidationException } from "@/src/contexts/shared/exceptions/validation.exception";

import {
  CONTACT_CLICK_TYPE,
  ContactClick,
  ContactClickType,
} from "../types/contact-click";
import { STATUS_VEHICLE } from "../types/vehicle";
import { VehicleNotFoundException } from "../exceptions/vehicle-not-found.exception";
import { TypeOrmVehicleRepository } from "@/src/contexts/vehicles/repositories/typeorm.vehicle-repository";
import { formatVehicleDisplayName } from "../utils/format-vehicle-display-name";
import { buildWhatsAppUrl } from "../helpers/build-whatsapp-url";
import { TypeOrmContactClickRepository } from "../repositories/typeorm.contact-click-repository";

export interface RecordVehicleContactClickInput {
  vehicle_id: string;
  type: ContactClickType;
  profile_id?: string;
}

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
export class ContactClicksService {
  constructor(
    private readonly vehicle_repository: TypeOrmVehicleRepository,
    private readonly contact_click_repository: TypeOrmContactClickRepository,
  ) {}

  async record(
    input: RecordVehicleContactClickInput,
  ): Promise<RecordVehicleContactClickResult> {
    const vehicle = await this.vehicle_repository.findOne(input.vehicle_id);
    if (!vehicle) {
      throw new VehicleNotFoundException(input.vehicle_id);
    }

    if (vehicle.status !== STATUS_VEHICLE.ACTIVE) {
      throw new ValidationException(
        "El vehículo no está disponible para consultas",
      );
    }

    const profile_id = input.profile_id ?? null;

    if (profile_id && profile_id === vehicle.profile_id) {
      throw new ValidationException("No puedes contactar tu propio anuncio");
    }

    if (vehicle.show_phone === false) {
      throw new ValidationException(
        "El teléfono no está disponible para este anuncio",
      );
    }

    const phone = vehicle.phone?.trim() || "";
    const phone_code = vehicle.phone_code?.trim() || "";

    if (!phone || !phone_code) {
      throw new ValidationException(
        "El teléfono no está disponible para este anuncio",
      );
    }

    if (
      input.type === CONTACT_CLICK_TYPE.WHATSAPP &&
      vehicle.has_whatsapp !== true
    ) {
      throw new ValidationException(
        "WhatsApp no está disponible para este anuncio",
      );
    }

    const contact_click = ContactClick.create({
      vehicle_id: input.vehicle_id,
      profile_id,
      type: input.type,
    });

    await this.contact_click_repository.record(contact_click);

    if (input.type === CONTACT_CLICK_TYPE.PHONE) {
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
