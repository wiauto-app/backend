import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { PaginatedResult } from "@/src/contexts/shared/types/paginated-result.vo";
import { formatVehicleDisplayName } from "../utils/format-vehicle-display-name";
import { Lead } from "../types/lead";
import type { LeadType } from "../types/lead";
import { LeadEntity } from "../entities/lead.entity";

export interface FindSellerLeadsOptions {
  viewer_profile_id: string;
  viewer_dealership_id: string | null;
  from?: Date;
  to?: Date;
  sort: "asc" | "desc";
  page: number;
  limit: number;
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
  vehicle: {
    id: string;
    title: string;
    image_url: string | null;
  };
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

  async findForSellerScope(
    options: FindSellerLeadsOptions,
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

    const total = await qb.clone().getCount();

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
      .orderBy("lead.created_at", sort_direction)
      .offset(skip)
      .limit(options.limit)
      .getRawMany<SellerLeadRawRow>();

    const data = rows.map((row) => this.mapRawToListItem(row));

    return new PaginatedResult(data, total, options.page, options.limit);
  }

  private mapRawToListItem(row: SellerLeadRawRow): SellerLeadListItem {
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
