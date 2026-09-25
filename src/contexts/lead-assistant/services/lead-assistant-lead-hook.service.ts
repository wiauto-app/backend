import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { TypeOrmVehicleRepository } from "@/src/contexts/vehicles/repositories/typeorm.vehicle-repository";
import { LEAD_TYPE, type PrimitiveLead } from "@/src/contexts/vehicles/types/lead";
import { ProfileEntity } from "@/src/contexts/profiles/entities/profile.entity";

import { LeadAssistantSettingsEntity } from "../entities/lead-assistant-settings.entity";
import { LeadAssistantReplyEnqueueService } from "../queues/lead-assistant-reply-enqueue.service";
import { LEAD_ASSISTANT_REPLY_CHANNEL } from "../queues/lead-assistant-reply.queue.constants";

@Injectable()
export class LeadAssistantLeadHookService {
  constructor(
    @InjectRepository(LeadAssistantSettingsEntity)
    private readonly settings_repository: Repository<LeadAssistantSettingsEntity>,
    @InjectRepository(ProfileEntity)
    private readonly profile_repository: Repository<ProfileEntity>,
    private readonly vehicle_repository: TypeOrmVehicleRepository,
    private readonly lead_assistant_reply_enqueue_service: LeadAssistantReplyEnqueueService,
  ) {}

  async handleGuestLead(lead: PrimitiveLead): Promise<void> {
    if (lead.type === LEAD_TYPE.CALL_ME || lead.ai_replied_at) {
      return;
    }
    if (!lead.email?.trim()) {
      return;
    }

    const vehicle = await this.vehicle_repository.findOne(lead.vehicle_id);
    if (!vehicle?.profile_id) {
      return;
    }

    const profile = await this.profile_repository.findOne({
      where: { id: vehicle.profile_id },
      relations: ["user"],
    });
    if (!profile) {
      return;
    }

    const is_seller_admin = profile.user.is_admin;
    const settings = await this.settings_repository.findOne({
      where: { profile_id: vehicle.profile_id },
    });
    if (!is_seller_admin && !settings?.enabled) {
      return;
    }

    const delay_ms = Math.max(0, settings?.reply_delay_seconds ?? 30) * 1000;
    await this.lead_assistant_reply_enqueue_service.enqueueEmail(
      {
        channel: LEAD_ASSISTANT_REPLY_CHANNEL.EMAIL,
        lead_id: lead.id,
        seller_id: vehicle.profile_id,
        vehicle_id: lead.vehicle_id,
      },
      delay_ms,
    );
  }
}
