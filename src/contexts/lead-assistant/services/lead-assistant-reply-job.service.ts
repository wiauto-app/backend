import { Logger } from "@nestjs/common";
import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { NotificationChannelDispatcher } from "@/src/contexts/alerts/services/notification-channel-dispatcher.service";
import { getFrontendPath } from "@/src/common/frontend-routes";
import { EntitlementsService } from "@/src/contexts/billing/services/entitlements.service";
import { ENTITLEMENT_FEATURE } from "@/src/contexts/billing/types/entitlement-features";
import {
  getLimitFromEntitlement,
} from "@/src/contexts/billing/types/entitlement-resolve";
import { SubscriptionEntity } from "@/src/contexts/billing/entities/subscription.entity";
import { ChatMessageGateway } from "@/src/contexts/chat/gateways/chat-message.gateway";
import { TypeOrmChatMessageRepository } from "@/src/contexts/chat/repositories/typeorm.chat-message-repository";
import { TypeOrmChatRepository } from "@/src/contexts/chat/repositories/typeorm.chat-repository";
import { ChatMessageReadModelService } from "@/src/contexts/chat/services/chat-message-read-model.service";
import { ChatMessageService } from "@/src/contexts/chat/services/chat-message.service";
import { TypeOrmChatParticipantStateRepository } from "@/src/contexts/chat/repositories/typeorm.chat-participant-state-repository";
import { CHAT_MESSAGE_TYPE } from "@/src/contexts/chat/types/chatMessage";
import { CHAT_AI_ASSISTANT_AUTHOR } from "@/src/contexts/chat/types/chatMessageMetadata";
import { TypeOrmProfileRepository } from "@/src/contexts/profiles/repositories/typeorm.profile-repository";
import { TypeOrmVehicleRepository } from "@/src/contexts/vehicles/repositories/typeorm.vehicle-repository";
import { LeadEntity } from "@/src/contexts/vehicles/entities/lead.entity";
import { TypeOrmLeadRepository } from "@/src/contexts/vehicles/repositories/typeorm.lead-repository";
import {
  LEAD_AI_REPLY_CHANNEL,
  LEAD_TYPE,
} from "@/src/contexts/vehicles/types/lead";
import { LeadScoringService } from "@/src/contexts/vehicles/services/lead-scoring.service";
import { OutboundMailEnqueueService } from "@/src/contexts/shared/mail/outbound-mail-enqueue.service";
import { formatVehicleDisplayName } from "@/src/contexts/vehicles/utils/format-vehicle-display-name";

import { LeadAssistantQuotaNoticeEntity } from "../entities/lead-assistant-quota-notice.entity";
import { LeadAssistantSettingsEntity } from "../entities/lead-assistant-settings.entity";
import {
  LEAD_ASSISTANT_REPLY_CHANNEL,
  type LeadAssistantReplyJobData,
} from "../queues/lead-assistant-reply.queue.constants";
import { mergeLeadAssistantSettings } from "../constants/lead-assistant-settings.defaults";
import { LeadAssistantReplyGenerationService } from "./lead-assistant-reply-generation.service";

@Injectable()
export class LeadAssistantReplyJobService {
  private readonly logger = new Logger(LeadAssistantReplyJobService.name);

  constructor(
    @InjectRepository(LeadAssistantSettingsEntity)
    private readonly settings_repository: Repository<LeadAssistantSettingsEntity>,
    @InjectRepository(LeadAssistantQuotaNoticeEntity)
    private readonly quota_notice_repository: Repository<LeadAssistantQuotaNoticeEntity>,
    @InjectRepository(SubscriptionEntity)
    private readonly subscription_repository: Repository<SubscriptionEntity>,
    private readonly entitlements_service: EntitlementsService,
    private readonly chat_repository: TypeOrmChatRepository,
    private readonly chat_message_repository: TypeOrmChatMessageRepository,
    private readonly chat_message_service: ChatMessageService,
    private readonly chat_message_read_model_service: ChatMessageReadModelService,
    private readonly chat_message_gateway: ChatMessageGateway,
    private readonly chat_participant_state_repository: TypeOrmChatParticipantStateRepository,
    private readonly vehicle_repository: TypeOrmVehicleRepository,
    private readonly profile_repository: TypeOrmProfileRepository,
    private readonly reply_generation_service: LeadAssistantReplyGenerationService,
    private readonly notification_dispatcher: NotificationChannelDispatcher,
    @InjectRepository(LeadEntity)
    private readonly lead_entity_repository: Repository<LeadEntity>,
    private readonly lead_repository: TypeOrmLeadRepository,
    private readonly lead_scoring_service: LeadScoringService,
    private readonly outbound_mail_enqueue_service: OutboundMailEnqueueService,
  ) {}

  async process(data: LeadAssistantReplyJobData): Promise<void> {
    if (data.channel === LEAD_ASSISTANT_REPLY_CHANNEL.EMAIL) {
      await this.processEmail(data);
      return;
    }
    await this.processChat(data);
  }

  private async processChat(data: LeadAssistantReplyJobData): Promise<void> {
    if (!data.chat_id || !data.trigger_message_id || !data.buyer_id) {
      return;
    }

    const lead = await this.lead_repository.findEntityById(data.lead_id);
    if (!lead || lead.type === LEAD_TYPE.CALL_ME || lead.ai_replied_at) {
      return;
    }

    const chat = await this.chat_repository.findOne(data.chat_id);
    if (!chat?.vehicle_id) {
      return;
    }

    const trigger = await this.chat_message_repository.findOne(
      data.trigger_message_id,
    );
    if (!trigger || trigger.type !== CHAT_MESSAGE_TYPE.TEXT) {
      return;
    }

    if (trigger.metadata?.author === CHAT_AI_ASSISTANT_AUTHOR) {
      return;
    }

    const seller_profile = await this.profile_repository.findOne(data.seller_id);
    const is_seller_admin = seller_profile?.user.is_admin === true;

    const settings_row = await this.settings_repository.findOne({
      where: { profile_id: data.seller_id },
    });
    if (!is_seller_admin && !settings_row?.enabled) {
      return;
    }

    const settings = mergeLeadAssistantSettings(data.seller_id, settings_row);

    const seller_side_ids = chat.participants.filter(
      (participant_id) => participant_id !== data.buyer_id,
    );

    for (const seller_participant_id of seller_side_ids) {
      const in_room = await this.chat_message_gateway.isUserInChatRoom(
        chat.id,
        seller_participant_id,
      );
      if (in_room) {
        return;
      }
    }

    const seller_replied = await this.chat_message_repository.hasSenderMessageAfter(
      chat.id,
      seller_side_ids,
      trigger.created_at,
    );
    if (seller_replied) {
      return;
    }

    const resolved = await this.entitlements_service.resolve(data.seller_id);
    const replies_limit = resolved.is_unlimited
      ? null
      : getLimitFromEntitlement(
          resolved.features[ENTITLEMENT_FEATURE.AI_REPLIES_PER_CONVERSATION],
        );
    const leads_check = await this.entitlements_service.checkUsage(
      data.seller_id,
      ENTITLEMENT_FEATURE.AI_LEAD_CONVERSATIONS as string,
    );

    const ai_replies_used =
      await this.chat_message_repository.countAiAssistantMessagesInChat(chat.id);

    const replies_allowed =
      resolved.is_unlimited ||
      replies_limit === null ||
      ai_replies_used < replies_limit;
    const leads_allowed = resolved.is_unlimited || leads_check.allowed;

    const is_first_ai_in_chat = ai_replies_used === 0;
    const needs_new_conversation_slot = is_first_ai_in_chat;

    if (!replies_allowed || (needs_new_conversation_slot && !leads_allowed)) {
      await this.maybeNotifyQuotaExhausted(
        settings,
        data,
        resolved.subscription_id,
      );
      return;
    }

    const vehicle = await this.vehicle_repository.findOne(data.vehicle_id);
    if (!vehicle) {
      return;
    }

    const recent = await this.chat_message_repository.findRecentTextExcerpts(
      chat.id,
      6,
    );

    const generated = await this.reply_generation_service.generate({
      vehicle,
      settings,
      buyer_message: trigger.content,
      recent_messages: recent,
    });

    const message = await this.chat_message_service.create({
      chat_id: chat.id,
      sender_id: data.seller_id,
      content: generated.reply_text,
      type: CHAT_MESSAGE_TYPE.TEXT,
      metadata: { author: CHAT_AI_ASSISTANT_AUTHOR },
    });

    await this.deliverMessage(message, chat, data.seller_id);

    if (needs_new_conversation_slot) {
      await this.entitlements_service.incrementMeteredUsage(
        data.seller_id,
        ENTITLEMENT_FEATURE.AI_LEAD_CONVERSATIONS as string,
        1,
      );
    }

    const buyer_profile = await this.profile_repository.findOne(data.buyer_id);
    const buyer_name = buyer_profile
      ? [buyer_profile.name, buyer_profile.last_name].filter(Boolean).join(" ").trim()
      : "Un comprador";

    const excerpt =
      generated.reply_text.length > 120
        ? `${generated.reply_text.slice(0, 117)}...`
        : generated.reply_text;

    if (settings.notify_on_reply) {
      await this.notification_dispatcher.notify({
        profile_id: data.seller_id,
        category: "lead_assistant_reply",
        title: "El asistente ha respondido en un chat",
        body: `${buyer_name}: ${excerpt}`,
        data: {
          chat_id: chat.id,
          vehicle_id: data.vehicle_id,
        },
      });
    }

    if (generated.is_hot_lead && settings.notify_on_hot_lead) {
      await this.notification_dispatcher.notify({
        profile_id: data.seller_id,
        category: "lead_assistant_hot_lead",
        title: "Lead caliente en el chat",
        body: `${buyer_name} parece listo para avanzar. Entra en la conversación.`,
        data: {
          chat_id: chat.id,
          vehicle_id: data.vehicle_id,
        },
      });
      await this.lead_scoring_service.markAiHot(data.lead_id);
    }

    await this.markLeadReplied(data.lead_id, LEAD_AI_REPLY_CHANNEL.CHAT);
  }

  private async processEmail(data: LeadAssistantReplyJobData): Promise<void> {
    const lead = await this.lead_repository.findEntityById(data.lead_id);
    if (!lead || lead.type === LEAD_TYPE.CALL_ME || lead.ai_replied_at) {
      return;
    }
    if (!lead.email?.trim()) {
      return;
    }

    const seller_profile = await this.profile_repository.findOne(data.seller_id);
    const is_seller_admin = seller_profile?.user.is_admin === true;
    const settings_row = await this.settings_repository.findOne({
      where: { profile_id: data.seller_id },
    });
    if (!is_seller_admin && !settings_row?.enabled) {
      return;
    }
    const settings = mergeLeadAssistantSettings(data.seller_id, settings_row);

    const resolved = await this.entitlements_service.resolve(data.seller_id);
    const leads_check = await this.entitlements_service.checkUsage(
      data.seller_id,
      ENTITLEMENT_FEATURE.AI_LEAD_CONVERSATIONS as string,
    );
    if (!resolved.is_unlimited && !leads_check.allowed) {
      return;
    }

    const vehicle = await this.vehicle_repository.findOne(data.vehicle_id);
    if (!vehicle) {
      return;
    }

    const buyer_message = lead.message?.trim() ?? "";
    const generated = await this.reply_generation_service.generate({
      vehicle,
      settings,
      buyer_message,
      recent_messages: buyer_message,
    });

    const vehicle_title = formatVehicleDisplayName({
      make_name: vehicle.version_summary.make_name,
      model_name: vehicle.version_summary.model_name,
      version_name: vehicle.version_summary.version_name,
    });

    const seller_email = seller_profile?.user.email ?? vehicle.email;
    await this.outbound_mail_enqueue_service.enqueue_lead_assistant_reply({
      to: lead.email.trim(),
      reply_to: seller_email,
      reply_text: generated.reply_text,
      vehicle_title,
      signup_url: getFrontendPath("/auth/registro"),
      vehicle_id: vehicle.id,
    });

    if (!resolved.is_unlimited) {
      await this.entitlements_service.incrementMeteredUsage(
        data.seller_id,
        ENTITLEMENT_FEATURE.AI_LEAD_CONVERSATIONS as string,
        1,
      );
    }

    if (generated.is_hot_lead) {
      await this.lead_scoring_service.markAiHot(data.lead_id);
    }

    await this.markLeadReplied(data.lead_id, LEAD_AI_REPLY_CHANNEL.EMAIL);
  }

  private async markLeadReplied(
    lead_id: string,
    channel: (typeof LEAD_AI_REPLY_CHANNEL)[keyof typeof LEAD_AI_REPLY_CHANNEL],
  ): Promise<void> {
    const row = await this.lead_entity_repository.preload({
      id: lead_id,
      ai_replied_at: new Date(),
      ai_reply_channel: channel,
    });
    if (!row) {
      return;
    }
    await this.lead_entity_repository.save(row);
  }

  private async deliverMessage(
    message: Awaited<ReturnType<ChatMessageService["create"]>>,
    chat: NonNullable<Awaited<ReturnType<TypeOrmChatRepository["findOne"]>>>,
    sender_id: string,
  ): Promise<void> {
    const list_item = await this.chat_message_read_model_service.toListItem(message);
    const delivered_messages =
      await this.chat_message_gateway.tryMarkDeliveredAndEmit(
        message,
        chat.participants,
      );
    this.chat_message_gateway.emitMessageCreated(list_item);

    const other_participant_ids = chat.participants.filter(
      (participant_id) => participant_id !== sender_id,
    );
    for (const participant_id of other_participant_ids) {
      const state = await this.chat_participant_state_repository.findOne(
        chat.id,
        participant_id,
      );
      this.chat_message_gateway.emitUnreadUpdated({
        chat_id: chat.id,
        user_id: participant_id,
        unread_count: state?.unread_count ?? 0,
      });
    }

    if (delivered_messages.length > 0) {
      for (const delivered of delivered_messages) {
        const delivered_item =
          await this.chat_message_read_model_service.toListItem(delivered);
        this.chat_message_gateway.emitMessageUpdated(delivered_item);
      }
    }
  }

  private async maybeNotifyQuotaExhausted(
    settings: LeadAssistantSettingsEntity,
    data: LeadAssistantReplyJobData,
    subscription_id: string | null,
  ): Promise<void> {
    if (!settings.notify_on_quota_exhausted || !subscription_id || !data.chat_id) {
      return;
    }

    const subscription = await this.subscription_repository.findOne({
      where: { id: subscription_id },
    });
    if (!subscription?.current_period_start) {
      return;
    }

    const existing = await this.quota_notice_repository.findOne({
      where: {
        profile_id: data.seller_id,
        chat_id: data.chat_id,
        period_start: subscription.current_period_start,
      },
    });
    if (existing) {
      return;
    }

    await this.quota_notice_repository.save({
      profile_id: data.seller_id,
      chat_id: data.chat_id,
      period_start: subscription.current_period_start,
    });

    await this.notification_dispatcher.notify({
      profile_id: data.seller_id,
      category: "lead_assistant_quota",
      title: "El asistente no pudo responder",
      body:
        "Se agotó el cupo de respuestas automáticas. Responde tú o amplía el plan.",
      data: {
        chat_id: data.chat_id,
        messages_url: getFrontendPath(
          `/usuario/mensajes?chat_id=${encodeURIComponent(data.chat_id)}`,
        ),
      },
    });
  }
}
