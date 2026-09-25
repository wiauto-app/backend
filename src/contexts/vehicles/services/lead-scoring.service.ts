import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { TypeOrmChatMessageRepository } from "@/src/contexts/chat/repositories/typeorm.chat-message-repository";
import { LEAD_SCORE_SIGNAL, LEAD_TIER } from "../types/lead-scoring";
import { LEAD_TYPE } from "../types/lead";
import { LeadEntity } from "../entities/lead.entity";
import { TypeOrmLeadRepository } from "../repositories/typeorm.lead-repository";
import { computeLeadScore } from "../utils/lead-scoring-rules";
import { LeadScoringEnqueueService } from "../queues/lead-scoring-enqueue.service";
import { ProactiveAlertEventService } from "@/src/contexts/proactive-alerts/services/proactive-alert-event.service";

const RECENT_LEADS_WINDOW_DAYS = 30;

@Injectable()
export class LeadScoringService {
  constructor(
    @InjectRepository(LeadEntity)
    private readonly lead_entity_repository: Repository<LeadEntity>,
    private readonly lead_repository: TypeOrmLeadRepository,
    private readonly chat_message_repository: TypeOrmChatMessageRepository,
    private readonly lead_scoring_enqueue_service: LeadScoringEnqueueService,
    private readonly proactive_alert_event_service: ProactiveAlertEventService,
  ) {}

  async scheduleRecalculate(lead_id: string, debounce_ms = 15_000): Promise<void> {
    await this.lead_scoring_enqueue_service.enqueueRecalculate(lead_id, debounce_ms);
  }

  async recalculateForLeadId(lead_id: string): Promise<void> {
    const lead = await this.lead_repository.findEntityById(lead_id);
    if (!lead) {
      return;
    }

    const previous_tier = lead.tier;
    const buyer_texts = await this.collectBuyerTexts(lead);
    const buyer_chat_messages_count = lead.chat_id
      ? await this.lead_repository.countBuyerTextMessagesInChat(
          lead.chat_id,
          lead.profile_id,
        )
      : 0;
    const fastest_buyer_reply_minutes = lead.chat_id
      ? await this.lead_repository.fastestBuyerReplyMinutes(
          lead.chat_id,
          lead.profile_id,
          lead.seller_profile_id,
        )
      : null;

    const other_recent_leads_count = lead.profile_id
      ? await this.lead_repository.countOtherRecentLeadsByBuyer(
          lead.profile_id,
          lead.id,
          RECENT_LEADS_WINDOW_DAYS,
        )
      : 0;

    const ai_hot = lead.score_signals.includes(LEAD_SCORE_SIGNAL.AI_HOT);

    const result = computeLeadScore({
      type: lead.type,
      is_authenticated: Boolean(lead.profile_id),
      has_phone: Boolean(lead.phone && lead.phone_code),
      buyer_texts,
      buyer_chat_messages_count,
      fastest_buyer_reply_minutes,
      other_recent_leads_count,
      ai_hot,
    });

    const row = await this.lead_entity_repository.preload({
      id: lead.id,
      score: result.score,
      tier: result.tier,
      score_signals: result.signals,
      scored_at: new Date(),
    });
    if (!row) {
      return;
    }
    await this.lead_entity_repository.save(row);

    if (
      previous_tier !== LEAD_TIER.HOT &&
      result.tier === LEAD_TIER.HOT &&
      lead.type !== LEAD_TYPE.CALL_ME
    ) {
      await this.proactive_alert_event_service.scheduleHotLeadUnansweredCheck(
        lead.id,
        lead.seller_profile_id,
      );
    }
  }

  async markAiHot(lead_id: string): Promise<void> {
    const lead = await this.lead_repository.findEntityById(lead_id);
    if (!lead) {
      return;
    }
    const signals = new Set(lead.score_signals);
    signals.add(LEAD_SCORE_SIGNAL.AI_HOT);
    const row = await this.lead_entity_repository.preload({
      id: lead.id,
      score_signals: [...signals],
    });
    if (row) {
      await this.lead_entity_repository.save(row);
    }
    await this.recalculateForLeadId(lead_id);
  }

  private async collectBuyerTexts(lead: LeadEntity): Promise<string[]> {
    const texts: string[] = [];
    if (lead.message?.trim()) {
      texts.push(lead.message.trim());
    }
    if (!lead.chat_id || !lead.profile_id) {
      return texts;
    }
    const excerpts = await this.chat_message_repository.findRecentTextExcerpts(
      lead.chat_id,
      20,
    );
    if (excerpts.trim()) {
      texts.push(excerpts);
    }
    return texts;
  }
}
