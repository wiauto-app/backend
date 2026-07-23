import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { ValidationException } from "@/src/contexts/shared/exceptions/validation.exception";
import { PaginatedResult } from "@/src/contexts/shared/types/paginated-result.vo";
import { NotificationChannelDispatcher } from "@/src/contexts/alerts/services/notification-channel-dispatcher.service";
import { ChatMessageService } from "@/src/contexts/chat/services/chat-message.service";
import { ChatService } from "@/src/contexts/chat/services/chat.service";
import { CHAT_TYPE, Chat } from "@/src/contexts/chat/types/chat";
import { CHAT_MESSAGE_TYPE } from "@/src/contexts/chat/types/chatMessage";
import { ChatAlreadyExistsException } from "@/src/contexts/chat/exceptions/chat-already-exist.exception";
import { TypeOrmChatRepository } from "@/src/contexts/chat/repositories/typeorm.chat-repository";
import { TypeOrmDealershipMemberRepository } from "@/src/contexts/dealership/repositories/typeorm.dealership-member-repository";
import { TypeOrmProfileRepository } from "@/src/contexts/profiles/repositories/typeorm.profile-repository";

import { LEAD_TYPE, Lead, PrimitiveLead } from "../types/lead";
import { STATUS_VEHICLE } from "../types/vehicle";
import { VehicleNotFoundException } from "../exceptions/vehicle-not-found.exception";
import { TypeOrmVehicleRepository } from "@/src/contexts/vehicles/repositories/typeorm.vehicle-repository";
import { formatVehicleDisplayName } from "../utils/format-vehicle-display-name";
import {
  SellerLeadListItem,
  TypeOrmLeadRepository,
} from "../repositories/typeorm.lead-repository";

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

export interface FindSellerLeadsInput {
  viewer_profile_id: string;
  from?: string;
  to?: string;
  sort: "asc" | "desc";
  page?: number;
  limit?: number;
}

@Injectable()
export class LeadsService {
  constructor(
    private readonly vehicle_repository: TypeOrmVehicleRepository,
    private readonly lead_repository: TypeOrmLeadRepository,
    private readonly notification_channel_dispatcher: NotificationChannelDispatcher,
    private readonly chat_service: ChatService,
    private readonly chat_message_service: ChatMessageService,
    private readonly chat_repository: TypeOrmChatRepository,
    private readonly profile_repository: TypeOrmProfileRepository,
    private readonly dealership_member_repository: TypeOrmDealershipMemberRepository,
  ) {}

  async findForSeller(
    input: FindSellerLeadsInput,
  ): Promise<PaginatedResult<SellerLeadListItem>> {
    const page = input.page && input.page > 0 ? input.page : 1;
    const limit =
      input.limit && input.limit > 0 ? Math.min(input.limit, 100) : 20;

    const viewer_dealership_id = await this.resolveDealershipId(
      input.viewer_profile_id,
    );

    return this.lead_repository.findForSellerScope({
      viewer_profile_id: input.viewer_profile_id,
      viewer_dealership_id,
      from: input.from ? this.parseRangeStart(input.from) : undefined,
      to: input.to ? this.parseRangeEnd(input.to) : undefined,
      sort: input.sort,
      page,
      limit,
    });
  }

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

    const seller_profile_id = vehicle.profile_id;
    const dealership_id = await this.resolveDealershipId(seller_profile_id);

    const lead = Lead.create({
      vehicle_id: input.vehicle_id,
      type: LEAD_TYPE.CONTACT,
      name: input.name.trim(),
      email: input.email.trim(),
      phone,
      phone_code,
      message: input.message.trim(),
      profile_id: buyer_profile_id,
      seller_profile_id,
      dealership_id,
    });

    await this.lead_repository.save(lead);

    const lead_primitive = lead.toPrimitives();
    const vehicle_title = formatVehicleDisplayName({
      make_name: vehicle.version.make.name,
      model_name: vehicle.version.model.name,
      version_name: vehicle.version.name,
    });

    await this.notify_lead_created({
      publisher_profile_id: seller_profile_id,
      email_override: vehicle.email,
      lead: lead_primitive,
      vehicle_title,
    });

    let chat_id: string | null = null;

    if (buyer_profile_id) {
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

    const phone = input.phone.trim() || null;
    const phone_code = input.phone_code.trim() || null;

    if (!phone || !phone_code) {
      throw new ValidationException("El teléfono es obligatorio");
    }

    await this.validateAuthenticatedName(input.name.trim(), buyer_profile_id);

    const callback_scheduled_at = this.parseAndValidateCallbackDate(
      input.callback_scheduled_at,
    );

    const seller_profile_id = vehicle.profile_id;
    const dealership_id = await this.resolveDealershipId(seller_profile_id);

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
      seller_profile_id,
      dealership_id,
    });

    await this.lead_repository.save(lead);

    const lead_primitive = lead.toPrimitives();
    const vehicle_title = formatVehicleDisplayName({
      make_name: vehicle.version.make.name,
      model_name: vehicle.version.model.name,
      version_name: vehicle.version.name,
    });

    await this.notify_lead_created({
      publisher_profile_id: seller_profile_id,
      email_override: vehicle.email,
      lead: lead_primitive,
      vehicle_title,
    });

    return { lead: lead_primitive, chat_id: null };
  }

  private async resolveDealershipId(
    profile_id: string,
  ): Promise<string | null> {
    const membership =
      await this.dealership_member_repository.findMembershipDetailByProfileId(
        profile_id,
      );

    return membership?.dealership_id ?? null;
  }

  private async notify_lead_created(payload: {
    publisher_profile_id: string;
    email_override: string;
    lead: PrimitiveLead;
    vehicle_title: string;
  }): Promise<void> {
    const is_call_me = payload.lead.type === LEAD_TYPE.CALL_ME;
    const title = is_call_me
      ? `Solicitud de llamada: ${payload.vehicle_title}`
      : `Nueva consulta: ${payload.vehicle_title}`;
    const body = is_call_me
      ? `${payload.lead.name} solicitó que lo llamen sobre ${payload.vehicle_title}`
      : `${payload.lead.name} envió una consulta sobre ${payload.vehicle_title}`;

    await this.notification_channel_dispatcher.notify({
      profile_id: payload.publisher_profile_id,
      category: "lead",
      title,
      body,
      email_override: payload.email_override,
      data: {
        lead_id: payload.lead.id,
        vehicle_id: payload.lead.vehicle_id,
        type: payload.lead.type,
        name: payload.lead.name,
        email: payload.lead.email,
        phone: payload.lead.phone,
        phone_code: payload.lead.phone_code,
        message: payload.lead.message,
        callback_scheduled_at: payload.lead.callback_scheduled_at
          ? new Date(payload.lead.callback_scheduled_at)
              .toISOString()
              .slice(0, 10)
          : null,
        vehicle_title: payload.vehicle_title,
        buyer_profile_id: payload.lead.profile_id,
      },
    });
  }

  /**
   * Date-only (YYYY-MM-DD) → start of that UTC day.
   * Full ISO → interpreted as-is (frontend should send local-day bounds as ISO).
   */
  private parseRangeStart(value: string): Date {
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return new Date(`${trimmed}T00:00:00.000Z`);
    }
    return new Date(trimmed);
  }

  /**
   * Date-only (YYYY-MM-DD) → inclusive end of that UTC day.
   * Full ISO → interpreted as-is (do not re-apply local setHours).
   */
  private parseRangeEnd(value: string): Date {
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return new Date(`${trimmed}T23:59:59.999Z`);
    }
    return new Date(trimmed);
  }

  private async resolveContactPhone(
    input: CreateLeadInput,
    buyer_profile_id: string | null,
  ): Promise<{ phone: string | null; phone_code: string | null }> {
    const phone = input.phone ?? null;
    const phone_code = input.phone_code ?? null;

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

    const profile_name =
      `${profile.name} ${profile.last_name ?? ""}`.trim();
    const profile_email = profile.user?.email;

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

    const profile_name =
      `${profile.name} ${profile.last_name ?? ""}`.trim();

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
