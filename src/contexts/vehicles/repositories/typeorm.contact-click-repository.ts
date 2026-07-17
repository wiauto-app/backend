import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";

import { ContactClick } from "../types/contact-click";
import { ContactClickEntity } from "../entities/contact-click.entity";

@Injectable()
export class TypeOrmContactClickRepository {
  constructor(
    @InjectDataSource()
    private readonly data_source: DataSource,
  ) {}

  async record(contact_click: ContactClick): Promise<void> {
    const primitive = contact_click.toPrimitives();

    await this.data_source.manager.save(
      this.data_source.manager.create(ContactClickEntity, {
        id: primitive.id,
        vehicle_id: primitive.vehicle_id,
        profile_id: primitive.profile_id,
        type: primitive.type,
        created_at: primitive.created_at,
      }),
    );
  }
}
