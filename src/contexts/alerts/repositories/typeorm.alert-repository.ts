import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { alertFiltersAreEqual } from "../types/normalize-alert-filters";
import { Alert } from "../types/alert";
import { AlertNotFoundException } from "../exceptions/alert-not-found.exception";
import type { AlertFilters } from "../types/alert-filters";
import { AlertEntity } from "../entities/alert.entity";

const entity_to_alert = (entity: AlertEntity): Alert =>
  Alert.fromPrimitives({
    id: entity.id,
    name: entity.name,
    created_at: entity.created_at,
    updated_at: entity.updated_at,
    profile_id: entity.profile_id,
    email: entity.email,
    phone: entity.phone,
    phone_code: entity.phone_code,
    filters: entity.filters,
    last_sent_at: entity.last_sent_at,
    is_active: entity.is_active,
    notify_new_listings: entity.notify_new_listings,
    notify_price_drops: entity.notify_price_drops,
    notify_sold_removed: entity.notify_sold_removed,
    notify_featured: entity.notify_featured,
    notify_recently_updated: entity.notify_recently_updated,
    last_viewed_at: entity.last_viewed_at,
  });

@Injectable()
export class TypeOrmAlertRepository {
  constructor(
    @InjectRepository(AlertEntity)
    private readonly alert_repository: Repository<AlertEntity>,
  ) {
  }

  async save(alert: Alert): Promise<void> {
    const primitive = alert.toPrimitives();
    await this.alert_repository.save(
      this.alert_repository.create({
        id: primitive.id,
        name: primitive.name,
        created_at: primitive.created_at,
        updated_at: primitive.updated_at,
        profile_id: primitive.profile_id,
        email: primitive.email,
        phone: primitive.phone,
        phone_code: primitive.phone_code,
        filters: primitive.filters,
        last_sent_at: primitive.last_sent_at,
        is_active: primitive.is_active,
        notify_new_listings: primitive.notify_new_listings,
        notify_price_drops: primitive.notify_price_drops,
        notify_sold_removed: primitive.notify_sold_removed,
        notify_featured: primitive.notify_featured,
        notify_recently_updated: primitive.notify_recently_updated,
        last_viewed_at: primitive.last_viewed_at,
      }),
    );
  }

  async findOne(id: string): Promise<Alert | null> {
    const row = await this.alert_repository.findOne({ where: { id } });
    if (!row) {
      return null;
    }
    return entity_to_alert(row);
  }

  async findAllByProfileId(profile_id: string): Promise<Alert[]> {
    const rows = await this.alert_repository.find({
      where: { profile_id },
      order: { created_at: "DESC" },
    });
    return rows.map((row) => entity_to_alert(row));
  }

  async findByProfileIdAndSourceVehicleId(
    profile_id: string,
    source_vehicle_id: string,
  ): Promise<Alert | null> {
    const row = await this.alert_repository
      .createQueryBuilder("alert")
      .where("alert.profile_id = :profile_id", { profile_id })
      .andWhere("alert.filters->>'source_vehicle_id' = :source_vehicle_id", {
        source_vehicle_id,
      })
      .getOne();

    if (!row) {
      return null;
    }

    return entity_to_alert(row);
  }

  async filtersMatch(
    profile_id: string,
    filters: AlertFilters,
  ): Promise<Alert | null> {
    const alerts = await this.findAllByProfileId(profile_id);

    for (const alert of alerts) {
      if (alertFiltersAreEqual(alert.toPrimitives().filters, filters)) {
        return alert;
      }
    }

    return null;
  }

  async findAll(): Promise<Alert[]> {
    const rows = await this.alert_repository.find({
      order: { created_at: "DESC" },
    });
    return rows.map((row) => entity_to_alert(row));
  }

  async findCandidatesForPublishedVehicle(params: {
    make_slug: string;
    model_slug: string;
    exclude_profile_id: string;
  }): Promise<Alert[]> {
    const rows = await this.alert_repository
      .createQueryBuilder("alert")
      .where("alert.profile_id != :exclude_profile_id", {
        exclude_profile_id: params.exclude_profile_id,
      })
      .andWhere("alert.is_active = true")
      .andWhere(
        `(
          alert.filters->'makes_slugs' IS NULL
          OR jsonb_typeof(alert.filters->'makes_slugs') != 'array'
          OR jsonb_array_length(alert.filters->'makes_slugs') = 0
          OR alert.filters->'makes_slugs' @> to_jsonb(ARRAY[:make_slug]::text[])
        )`,
        { make_slug: params.make_slug },
      )
      .andWhere(
        `(
          alert.filters->'models_slugs' IS NULL
          OR jsonb_typeof(alert.filters->'models_slugs') != 'array'
          OR jsonb_array_length(alert.filters->'models_slugs') = 0
          OR alert.filters->'models_slugs' @> to_jsonb(ARRAY[:model_slug]::text[])
        )`,
        { model_slug: params.model_slug },
      )
      .getMany();

    return rows.map((row) => entity_to_alert(row));
  }

  async update(alert: Alert): Promise<void> {
    const primitive = alert.toPrimitives();
    const preloaded = await this.alert_repository.preload({
      id: primitive.id,
      name: primitive.name,
      profile_id: primitive.profile_id,
      email: primitive.email,
      phone: primitive.phone,
      phone_code: primitive.phone_code,
      filters: primitive.filters,
      last_sent_at: primitive.last_sent_at,
      is_active: primitive.is_active,
      notify_new_listings: primitive.notify_new_listings,
      notify_price_drops: primitive.notify_price_drops,
      notify_sold_removed: primitive.notify_sold_removed,
      notify_featured: primitive.notify_featured,
      notify_recently_updated: primitive.notify_recently_updated,
      last_viewed_at: primitive.last_viewed_at,
      updated_at: primitive.updated_at,
    });

    if (!preloaded) {
      throw new AlertNotFoundException(primitive.id);
    }

    await this.alert_repository.save(preloaded);
  }

  async delete(id: string): Promise<void> {
    await this.alert_repository.delete(id);
  }
}
