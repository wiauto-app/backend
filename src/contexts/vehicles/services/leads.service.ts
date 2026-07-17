import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { ValidationException } from "@/src/contexts/shared/exceptions/validation.exception";
import { ChatMessageService } from "@/src/contexts/chat/services/chat-message.service";
import { ChatService } from "@/src/contexts/chat/services/chat.service";
import { CHAT_TYPE, Chat } from "@/src/contexts/chat/types/chat";
import { CHAT_MESSAGE_TYPE } from "@/src/contexts/chat/types/chatMessage";
import { ChatAlreadyExistsException } from "@/src/contexts/chat/exceptions/chat-already-exist.exception";
import { TypeOrmChatRepository } from "@/src/contexts/chat/repositories/typeorm.chat-repository";
import { TypeOrmProfileRepository } from "@/src/contexts/profiles/repositories/typeorm.profile-repository";

import { LEAD_TYPE, Lead, PrimitiveLead } from "../types/lead";
import { STATUS_VEHICLE } from "../types/vehicle";
import { VehicleNotFoundException } from "../exceptions/vehicle-not-found.exception";
import { TypeOrmVehicleRepository } from "@/src/contexts/vehicles/repositories/typeorm.vehicle-repository";
import { formatVehicleDisplayName } from "../utils/format-vehicle-display-name";
import { TypeOrmLeadRepository } from "../repositories/typeorm.lead-repository";
import { LeadNotificationMailService } from "../services/lead-notification-mail.service";

export interface CreateLeadInput {
  vehicle_id: string;
  name: string;
  email: string;
  phone?: string;
  phone_code?: string;
  message: string;
  buyer_profile_id?: string;
}

export interface CreateCallMeLeadInput {
  vehicle_id: string;
  name: string;
  phone: string;
  phone_code: string;
  callback_scheduled_at: string;
  buyer_profile_id?: string;
}

@Injectable()
export class LeadsService {
  constructor(
    private readonly vehicle_repository: TypeOrmVehicleRepository,
    private readonly lead_repository: TypeOrmLeadRepository,
    private readonly lead_notification_mail_service: LeadNotificationMailService,
    private readonly chat_service: ChatService,
    private readonly chat_message_service: ChatMessageService,
    private readonly chat_repository: TypeOrmChatRepository,
    private readonly profile_repository: TypeOrmProfileRepository,
  ) {}

  async createContact(
    input: CreateLeadInput,
  ): Promise<{ lead: PrimitiveLead; chat_id: string | null }> {
    const vehicle = await this.vehicle_repository.findOne(input.vehicle_id);
    if (!vehicle) {
      throw new VehicleNotFoundException(input.vehicle_id);
    }

    if (vehicle.status !== STATUS_VEHICLE.ACTIVE) {
      throw new ValidationException(
        "El vehículo no está disponible para consultas",
      );
    }

    const buyer_profile_id = input.buyer_profile_id ?? null;

    if (buyer_profile_id && buyer_profile_id === vehicle.profile_id) {
      throw new ValidationException("No puedes contactar tu propio anuncio");
    }

    const { phone, phone_code } = await this.resolveContactPhone(
      input,
      buyer_profile_id,
    );

    const lead = Lead.create({
      vehicle_id: input.vehicle_id,
      type: LEAD_TYPE.CONTACT,
      name: input.name.trim(),
      email: input.email.trim(),
      phone,
      phone_code,
      message: input.message.trim(),
      profile_id: buyer_profile_id,
    });

    await this.lead_repository.save(lead);

    const lead_primitive = lead.toPrimitives();

    await this.lead_notification_mail_service.send_notification_email({
      to: vehicle.email,
      lead: lead_primitive,
      vehicle_title: formatVehicleDisplayName({
        make_name: vehicle.version.make.name,
        model_name: vehicle.version.model.name,
        version_name: vehicle.version.name,
      }),
    });

    let chat_id: string | null = null;

    if (buyer_profile_id) {
      const seller_profile_id = vehicle.profile_id;
      const chat = await this.findOrCreateVehicleChat(
        seller_profile_id,
        buyer_profile_id,
        input.vehicle_id,
      );

      await this.chat_message_service.create({
        chat_id: chat.id,
        sender_id: buyer_profile_id,
        content: input.message.trim(),
        type: CHAT_MESSAGE_TYPE.TEXT,
      });

      chat_id = chat.id;
    }

    return { lead: lead_primitive, chat_id };
  }

  async createCallMe(
    input: CreateCallMeLeadInput,
  ): Promise<{ lead: PrimitiveLead; chat_id: null }> {
    const vehicle = await this.vehicle_repository.findOne(input.vehicle_id);
    if (!vehicle) {
      throw new VehicleNotFoundException(input.vehicle_id);
    }

    if (vehicle.status !== STATUS_VEHICLE.ACTIVE) {
      throw new ValidationException(
        "El vehículo no está disponible para consultas",
      );
    }

    const buyer_profile_id = input.buyer_profile_id ?? null;

    if (buyer_profile_id && buyer_profile_id === vehicle.profile_id) {
      throw new ValidationException("No puedes contactar tu propio anuncio");
    }

    const phone = input.phone?.trim() || null;
    const phone_code = input.phone_code?.trim() || null;

    if (!phone || !phone_code) {
      throw new ValidationException("El teléfono es obligatorio");
    }

    await this.validateAuthenticatedName(input.name.trim(), buyer_profile_id);

    const callback_scheduled_at = this.parseAndValidateCallbackDate(
      input.callback_scheduled_at,
    );

    const lead = Lead.create({
      vehicle_id: input.vehicle_id,
      type: LEAD_TYPE.CALL_ME,
      name: input.name.trim(),
      email: null,
      phone,
      phone_code,
      message: null,
      callback_scheduled_at,
      profile_id: buyer_profile_id,
    });

    await this.lead_repository.save(lead);

    const lead_primitive = lead.toPrimitives();

    await this.lead_notification_mail_service.send_notification_email({
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

  private async resolveContactPhone(
    input: CreateLeadInput,
    buyer_profile_id: string | null,
  ): Promise<{ phone: string | null; phone_code: string | null }> {
    const phone = input.phone?.trim() || null;
    const phone_code = input.phone_code?.trim() || null;

    if (!buyer_profile_id) {
      if (!phone || !phone_code) {
        throw new ValidationException(
          "El teléfono es obligatorio para consultas sin sesión",
        );
      }
      return { phone, phone_code };
    }

    const profile = await this.profile_repository.findOne(buyer_profile_id);
    if (!profile) {
      throw new ValidationException("Perfil de usuario no encontrado");
    }

    const profile_primitive = profile.toPrimitives();
    const profile_name =
      `${profile_primitive.name} ${profile_primitive.last_name ?? ""}`.trim();
    const profile_email = profile_primitive.user?.email;

    if (input.name.trim() !== profile_name) {
      throw new ValidationException("El nombre no coincide con tu perfil");
    }

    if (profile_email && input.email.trim() !== profile_email) {
      throw new ValidationException("El correo no coincide con tu perfil");
    }

    return { phone, phone_code };
  }

  private async validateAuthenticatedName(
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
    const profile_name =
      `${profile_primitive.name} ${profile_primitive.last_name ?? ""}`.trim();

    if (name !== profile_name) {
      throw new ValidationException("El nombre no coincide con tu perfil");
    }
  }

  private parseAndValidateCallbackDate(callback_scheduled_at: string): Date {
    const date_match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(
      callback_scheduled_at.trim(),
    );
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
      throw new ValidationException(
        "La fecha de llamada debe ser hoy o una fecha futura",
      );
    }

    return parsed_date;
  }

  private async findOrCreateVehicleChat(
    seller_profile_id: string,
    buyer_profile_id: string,
    vehicle_id: string,
  ): Promise<Chat> {
    try {
      return await this.chat_service.create({
        participants: [seller_profile_id, buyer_profile_id],
        chat_type: CHAT_TYPE.PRIVATE,
        vehicle_id,
      });
    } catch (error) {
      if (!(error instanceof ChatAlreadyExistsException)) {
        throw error;
      }

      const existing_chat =
        await this.chat_repository.findOneByParticipantsAndVehicle(
          [seller_profile_id, buyer_profile_id],
          vehicle_id,
        );

      if (!existing_chat) {
        throw error;
      }

      return existing_chat;
    }
  }
}
