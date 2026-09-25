import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { PaginatedResult } from "@/src/contexts/shared/types/paginated-result.vo";
import { CHAT_MESSAGE_TYPE } from "@/src/contexts/chat/types/chatMessage";
import { formatVehicleDisplayName } from "../utils/format-vehicle-display-name";
import { Lead } from "../types/lead";
import type { LeadType } from "../types/lead";
import { LEAD_TIER, type LeadScoreSignal, type LeadSortBy, type LeadTier } from "../types/lead-scoring";
import { LeadEntity } from "../entities/lead.entity";

export interface FindSellerLeadsOptions {
  viewer_profile_id: string;
  viewer_dealership_id: string | null;
  from?: Date;
  to?: Date;
  sort: "asc" | "desc";
  sort_by: LeadSortBy;
  tier?: LeadTier;
  page: number;
  limit: number;
}

export interface SellerLeadScoringView {
  score: number;
  tier: LeadTier;
  signals: LeadScoreSignal[];
  scored_at: Date | null;
}

export interface SellerLeadListItem {
  id: string;
  type: LeadType;
  name: string;
  email: string | null;
  phone: string | null;
  phone_code: string | null;
  message: string | null;
  callback_scheduled_at: Date | null;
  created_at: Date;
  buyer_profile_id: string | null;
  chat_id: string | null;
  scoring: SellerLeadScoringView | null;
  vehicle: {
    id: string;
    title: string;
    image_url: string | null;
  };
}

export interface SellerLeadTierCounts {
  hot: number;
  warm: number;
  cold: number;
}

interface SellerLeadRawRow {
  lead_id: string;
  lead_type: LeadType;
  lead_name: string;
  lead_email: string | null;
  lead_phone: string | null;
  lead_phone_code: string | null;
  lead_message: string | null;
  lead_callback_scheduled_at: Date | null;
  lead_created_at: Date;
  lead_profile_id: string | null;
  lead_chat_id: string | null;
  lead_score: number;
  lead_tier: LeadTier;
  lead_score_signals: LeadScoreSignal[];
  lead_scored_at: Date | null;
  vehicle_id: string;
  make_name: string | null;
  model_name: string | null;
  version_name: string | null;
  cover_image_url: string | null;
}

@Injectable()
export class TypeOrmLeadRepository {
  constructor(
    @InjectRepository(LeadEntity)
    private readonly lead_repository: Repository<LeadEntity>,
  ) {}

  async save(lead: Lead): Promise<void> {
    const primitive = lead.toPrimitives();
    await this.lead_repository.save(this.lead_repository.create(primitive));
  }

  async findEntityById(id: string): Promise<LeadEntity | null> {
    return this.lead_repository.findOne({ where: { id } });
  }

  async findLatestByChatId(chat_id: string): Promise<LeadEntity | null> {
    return this.lead_repository.findOne({
      where: { chat_id },
      order: { created_at: "DESC" },
    });
  }

  async findForSellerScope(
    options: FindSellerLeadsOptions,
    include_scoring: boolean,
  ): Promise<PaginatedResult<SellerLeadListItem>> {
    const skip = (options.page - 1) * options.limit;
    const sort_direction = options.sort === "asc" ? "ASC" : "DESC";

    const qb = this.lead_repository
      .createQueryBuilder("lead")
      .innerJoin("vehicles", "vehicle", "vehicle.id = lead.vehicle_id")
      .innerJoin("version", "ver", "ver.id = vehicle.version_id")
      .innerJoin("make", "mk", "mk.id = ver.make_id")
      .innerJoin("model", "md", "md.id = ver.model_id");

    if (options.viewer_dealership_id) {
      qb.where(
        `(
          lead.seller_profile_id = :viewer_profile_id
          OR lead.dealership_id = :viewer_dealership_id
        )`,
        {
          viewer_profile_id: options.viewer_profile_id,
          viewer_dealership_id: options.viewer_dealership_id,
        },
      );
    } else {
      qb.where("lead.seller_profile_id = :viewer_profile_id", {
        viewer_profile_id: options.viewer_profile_id,
      });
    }

    if (options.from) {
      qb.andWhere("lead.created_at >= :from", { from: options.from });
    }

    if (options.to) {
      qb.andWhere("lead.created_at <= :to", { to: options.to });
    }

    if (options.tier) {
      qb.andWhere("lead.tier = :tier", { tier: options.tier });
    }

    const total = await qb.clone().getCount();

    const order_column =
      options.sort_by === "score" && include_scoring
        ? "lead.score"
        : "lead.created_at";

    const rows = await qb
      .select([
        "lead.id AS lead_id",
        "lead.type AS lead_type",
        "lead.name AS lead_name",
        "lead.email AS lead_email",
        "lead.phone AS lead_phone",
        "lead.phone_code AS lead_phone_code",
        "lead.message AS lead_message",
        "lead.callback_scheduled_at AS lead_callback_scheduled_at",
        "lead.created_at AS lead_created_at",
        "lead.profile_id AS lead_profile_id",
        "lead.chat_id AS lead_chat_id",
        "lead.score AS lead_score",
        "lead.tier AS lead_tier",
        "lead.score_signals AS lead_score_signals",
        "lead.scored_at AS lead_scored_at",
        "vehicle.id AS vehicle_id",
        "mk.name AS make_name",
        "md.name AS model_name",
        "ver.name AS version_name",
        `(
          SELECT vi.url
          FROM vehicle_images vi
          WHERE vi.vehicle_id = vehicle.id
          ORDER BY vi.created_at ASC
          LIMIT 1
        ) AS cover_image_url`,
      ])
      .orderBy(order_column, sort_direction)
      .addOrderBy("lead.created_at", "DESC")
      .offset(skip)
      .limit(options.limit)
      .getRawMany<SellerLeadRawRow>();

    const data = rows.map((row) =>
      this.mapRawToListItem(row, include_scoring),
    );

    return new PaginatedResult(data, total, options.page, options.limit);
  }

  async countTierForSellerScope(
    options: Omit<FindSellerLeadsOptions, "page" | "limit" | "sort" | "sort_by">,
  ): Promise<SellerLeadTierCounts> {
    const qb = this.lead_repository.createQueryBuilder("lead");

    if (options.viewer_dealership_id) {
      qb.where(
        `(
          lead.seller_profile_id = :viewer_profile_id
          OR lead.dealership_id = :viewer_dealership_id
        )`,
        {
          viewer_profile_id: options.viewer_profile_id,
          viewer_dealership_id: options.viewer_dealership_id,
        },
      );
    } else {
      qb.where("lead.seller_profile_id = :viewer_profile_id", {
        viewer_profile_id: options.viewer_profile_id,
      });
    }

    if (options.from) {
      qb.andWhere("lead.created_at >= :from", { from: options.from });
    }
    if (options.to) {
      qb.andWhere("lead.created_at <= :to", { to: options.to });
    }

    const rows = await qb
      .select("lead.tier", "tier")
      .addSelect("COUNT(*)", "count")
      .groupBy("lead.tier")
      .getRawMany<{ tier: LeadTier; count: string }>();

    const counts: SellerLeadTierCounts = { hot: 0, warm: 0, cold: 0 };
    for (const row of rows) {
      if (row.tier === LEAD_TIER.HOT) counts.hot = Number(row.count);
      if (row.tier === LEAD_TIER.WARM) counts.warm = Number(row.count);
      if (row.tier === LEAD_TIER.COLD) counts.cold = Number(row.count);
    }
    return counts;
  }

  async countBuyerTextMessagesInChat(
    chat_id: string,
    buyer_profile_id: string | null,
  ): Promise<number> {
    if (!buyer_profile_id) {
      return 0;
    }
    return this.lead_repository.manager
      .createQueryBuilder()
      .from("chat_messages", "message")
      .where("message.chat_id = :chat_id", { chat_id })
      .andWhere("message.deleted_at IS NULL")
      .andWhere("message.type = :type", { type: CHAT_MESSAGE_TYPE.TEXT })
      .andWhere("message.sender_id = :buyer_profile_id", { buyer_profile_id })
      .getCount();
  }

  async fastestBuyerReplyMinutes(
    chat_id: string,
    buyer_profile_id: string | null,
    seller_profile_id: string,
  ): Promise<number | null> {
    if (!buyer_profile_id) {
      return null;
    }

    const rows = await this.lead_repository.manager.query<
      { minutes: number | null }[]
    >(
      `
      SELECT MIN(
        EXTRACT(EPOCH FROM (buyer.created_at - seller.created_at)) / 60.0
      ) AS minutes
      FROM chat_messages seller
      INNER JOIN chat_messages buyer
        ON buyer.chat_id = seller.chat_id
       AND buyer.sender_id = $3
       AND buyer.deleted_at IS NULL
       AND buyer.type = 'text'
       AND buyer.created_at > seller.created_at
      WHERE seller.chat_id = $1
        AND seller.sender_id = ANY($2::uuid[])
        AND seller.deleted_at IS NULL
        AND seller.type = 'text'
      `,
      [chat_id, [seller_profile_id], buyer_profile_id],
    );

    const value = rows[0]?.minutes;
    if (value == null || !Number.isFinite(Number(value))) {
      return null;
    }
    return Math.max(0, Math.round(Number(value)));
  }

  async countOtherRecentLeadsByBuyer(
    buyer_profile_id: string,
    exclude_lead_id: string,
    window_days: number,
  ): Promise<number> {
    const since = new Date();
    since.setDate(since.getDate() - window_days);
    return this.lead_repository
      .createQueryBuilder("lead")
      .where("lead.profile_id = :buyer_profile_id", { buyer_profile_id })
      .andWhere("lead.id != :exclude_lead_id", { exclude_lead_id })
      .andWhere("lead.created_at >= :since", { since })
      .getCount();
  }

  async countLeadsForVehicleSinceDays(
    vehicle_id: string,
    days: number,
  ): Promise<number> {
    const since = new Date();
    since.setDate(since.getDate() - days);
    return this.lead_repository
      .createQueryBuilder("lead")
      .where("lead.vehicle_id = :vehicle_id", { vehicle_id })
      .andWhere("lead.created_at >= :since", { since })
      .getCount();
  }

  async countPendingReplyLeads(
    seller_profile_id: string,
    min_hours: number,
  ): Promise<number> {
    const threshold = new Date(Date.now() - min_hours * 60 * 60 * 1000);
    const rows = await this.lead_repository.manager.query<{ count: string }[]>(
      `
      SELECT COUNT(*)::text AS count
      FROM leads l
      WHERE l.seller_profile_id = $1
        AND l.created_at <= $2
        AND l.type = 'contact'
        AND (
          l.chat_id IS NULL
          OR NOT EXISTS (
            SELECT 1 FROM chat_messages m
            WHERE m.chat_id = l.chat_id
              AND m.sender_id = l.seller_profile_id
              AND m.deleted_at IS NULL
              AND m.created_at > l.created_at
          )
        )
      `,
      [seller_profile_id, threshold],
    );
    return Number(rows[0]?.count ?? 0);
  }

  async hoursSinceLeadWithoutSellerReply(lead_id: string): Promise<number> {
    const lead = await this.findEntityById(lead_id);
    if (!lead) {
      return 0;
    }
    const has_reply = await this.lead_repository.manager.query<{ ok: boolean }[]>(
      `
      SELECT EXISTS (
        SELECT 1 FROM chat_messages m
        WHERE m.chat_id = $1
          AND m.sender_id = $2
          AND m.deleted_at IS NULL
          AND m.created_at > $3
      ) AS ok
      `,
      [lead.chat_id, lead.seller_profile_id, lead.created_at],
    );
    if (has_reply[0]?.ok) {
      return 0;
    }
    return (Date.now() - lead.created_at.getTime()) / (60 * 60 * 1000);
  }

  async summarizeWeeklyEngagement(seller_profile_id: string): Promise<{
    views: number;
    leads: number;
    hot_leads: number;
  }> {
    const since = new Date();
    since.setDate(since.getDate() - 7);
    const leads = await this.lead_repository
      .createQueryBuilder("lead")
      .where("lead.seller_profile_id = :seller_profile_id", { seller_profile_id })
      .andWhere("lead.created_at >= :since", { since })
      .getCount();
    const hot_leads = await this.lead_repository
      .createQueryBuilder("lead")
      .where("lead.seller_profile_id = :seller_profile_id", { seller_profile_id })
      .andWhere("lead.created_at >= :since", { since })
      .andWhere("lead.tier = :tier", { tier: LEAD_TIER.HOT })
      .getCount();

    const views_rows = await this.lead_repository.manager.query<{ count: string }[]>(
      `
      SELECT COUNT(*)::text AS count
      FROM vehicle_views v
      INNER JOIN vehicles veh ON veh.id = v.vehicle_id
      WHERE veh.profile_id = $1
        AND v.created_at >= $2
      `,
      [seller_profile_id, since],
    );

    return {
      views: Number(views_rows[0]?.count ?? 0),
      leads,
      hot_leads,
    };
  }

  private mapRawToListItem(
    row: SellerLeadRawRow,
    include_scoring: boolean,
  ): SellerLeadListItem {
    return {
      id: row.lead_id,
      type: row.lead_type,
      name: row.lead_name,
      email: row.lead_email,
      phone: row.lead_phone,
      phone_code: row.lead_phone_code,
      message: row.lead_message,
      callback_scheduled_at: row.lead_callback_scheduled_at,
      created_at: row.lead_created_at,
      buyer_profile_id: row.lead_profile_id,
      chat_id: row.lead_chat_id,
      scoring: include_scoring
        ? {
            score: row.lead_score,
            tier: row.lead_tier,
            signals: row.lead_score_signals ?? [],
            scored_at: row.lead_scored_at,
          }
        : null,
      vehicle: {
        id: row.vehicle_id,
        title: formatVehicleDisplayName({
          make_name: row.make_name,
          model_name: row.model_name,
          version_name: row.version_name,
        }),
        image_url: row.cover_image_url,
      },
    };
  }
}
