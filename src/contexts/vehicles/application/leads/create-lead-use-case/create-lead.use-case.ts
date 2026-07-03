import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { ValidationException } from "@/src/contexts/shared/exceptions/validation.exception";
import { CreateChatMessageUseCase } from "@/src/contexts/chat/application/chat-message-use-cases/create-chat-message-use-case/create-chat-message.use-case";
import { CreateChatUseCase } from "@/src/contexts/chat/application/chat-use-cases/create-chat-use-case/create-chat.use-case";
import { CHAT_TYPE, Chat } from "@/src/contexts/chat/domain/entities/chat";
import { CHAT_MESSAGE_TYPE } from "@/src/contexts/chat/domain/entities/chatMessage";
import { ChatAlreadyExistsException } from "@/src/contexts/chat/domain/exceptions/chat-already-exist.exception";
import { ChatRepository } from "@/src/contexts/chat/domain/repositories/chat.repository";
import { ProfileRepository } from "@/src/contexts/profiles/domain/repositories/profile.repository";

import { STATUS_VEHICLE } from "../../../domain/entities/vehicle";
import { formatVehicleDisplayName } from "../../../domain/utils/format-vehicle-display-name";
import { LEAD_TYPE, Lead, PrimitiveLead } from "../../../domain/entities/lead";
import { VehicleNotFoundException } from "../../../domain/exceptions/vehicle-not-found.exception";
import { LeadRepository } from "../../../domain/repositories/lead.repository";
import { VehicleRepository } from "../../../domain/repositories/vehicle.repository";
import { LeadNotificationEmailService } from "../../ports/lead-notification-email.port";
import { CreateLeadDto } from "./create-lead.dto";

@Injectable()
export class CreateLeadUseCase {
  constructor(
    private readonly vehicle_repository: VehicleRepository,
    private readonly lead_repository: LeadRepository,
    private readonly lead_notification_email_service: LeadNotificationEmailService,
    private readonly create_chat_use_case: CreateChatUseCase,
    private readonly create_chat_message_use_case: CreateChatMessageUseCase,
    private readonly chat_repository: ChatRepository,
    private readonly profile_repository: ProfileRepository,
  ) {}

  async execute(
    create_lead_dto: CreateLeadDto,
  ): Promise<{ lead: PrimitiveLead; chat_id: string | null }> {
    const vehicle = await this.vehicle_repository.findOne(create_lead_dto.vehicle_id);
    if (!vehicle) {
      throw new VehicleNotFoundException(create_lead_dto.vehicle_id);
    }

    if (vehicle.status !== STATUS_VEHICLE.ACTIVE) {
      throw new ValidationException("El vehículo no está disponible para consultas");
    }

    const buyer_profile_id = create_lead_dto.buyer_profile_id ?? null;

    if (buyer_profile_id && buyer_profile_id === vehicle.profile_id) {
      throw new ValidationException("No puedes contactar tu propio anuncio");
    }

    const { phone, phone_code } = await this.resolve_contact_phone(
      create_lead_dto,
      buyer_profile_id,
    );

    const lead = Lead.create({
      vehicle_id: create_lead_dto.vehicle_id,
      type: LEAD_TYPE.CONTACT,
      name: create_lead_dto.name.trim(),
      email: create_lead_dto.email.trim(),
      phone,
      phone_code,
      message: create_lead_dto.message.trim(),
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

    let chat_id: string | null = null;

    if (buyer_profile_id) {
      const seller_profile_id = vehicle.profile_id;
      const chat = await this.find_or_create_vehicle_chat(
        seller_profile_id,
        buyer_profile_id,
        create_lead_dto.vehicle_id,
      );

      await this.create_chat_message_use_case.execute({
        chat_id: chat.id,
        sender_id: buyer_profile_id,
        content: create_lead_dto.message.trim(),
        type: CHAT_MESSAGE_TYPE.TEXT,
      });

      chat_id = chat.id;
    }

    return { lead: lead_primitive, chat_id };
  }

  private async resolve_contact_phone(
    create_lead_dto: CreateLeadDto,
    buyer_profile_id: string | null,
  ): Promise<{ phone: string | null; phone_code: string | null }> {
    const phone = create_lead_dto.phone?.trim() || null;
    const phone_code = create_lead_dto.phone_code?.trim() || null;

    if (!buyer_profile_id) {
      if (!phone || !phone_code) {
        throw new ValidationException("El teléfono es obligatorio para consultas sin sesión");
      }
      return { phone, phone_code };
    }

    const profile = await this.profile_repository.findOne(buyer_profile_id);
    if (!profile) {
      throw new ValidationException("Perfil de usuario no encontrado");
    }

    const profile_primitive = profile.toPrimitives();
    const profile_name = `${profile_primitive.name} ${profile_primitive.last_name ?? ""}`.trim();
    const profile_email = profile_primitive.user?.email;

    if (create_lead_dto.name.trim() !== profile_name) {
      throw new ValidationException("El nombre no coincide con tu perfil");
    }

    if (profile_email && create_lead_dto.email.trim() !== profile_email) {
      throw new ValidationException("El correo no coincide con tu perfil");
    }

    return { phone, phone_code };
  }

  private async find_or_create_vehicle_chat(
    seller_profile_id: string,
    buyer_profile_id: string,
    vehicle_id: string,
  ): Promise<Chat> {
    try {
      return await this.create_chat_use_case.execute({
        participants: [seller_profile_id, buyer_profile_id],
        chat_type: CHAT_TYPE.PRIVATE,
        vehicle_id,
      });
    } catch (error) {
      if (!(error instanceof ChatAlreadyExistsException)) {
        throw error;
      }

      const existing_chat = await this.chat_repository.findOneByParticipantsAndVehicle(
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
