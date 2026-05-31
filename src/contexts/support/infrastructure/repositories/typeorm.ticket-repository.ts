import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Ticket } from "../../domain/entities/ticket";
import { TicketNotFoundException } from "../../domain/exceptions/ticket-not-found.exception";
import { TicketFilter } from "../../domain/filters/ticket.filter";
import { TicketListItem } from "../../domain/read-models/ticket-list-item";
import { TicketRepository } from "../../domain/repositories/ticket.repository";
import { TicketEntity } from "../persistence/ticket.entity";

const TICKET_SORT_KEYS = new Set([
  "id",
  "title",
  "status",
  "created_at",
  "updated_at",
]);

const entity_to_list_item = (row: TicketEntity): TicketListItem => ({
  id: row.id,
  title: row.title,
  description: row.description,
  file_url: row.file_url,
  status: row.status,
  profile_id: row.profile_id,
  profile_label: row.profile?.name ?? "",
  created_at: row.created_at,
  updated_at: row.updated_at,
  category: {
    id: row.category.id,
    name: row.category.name,
    slug: row.category.slug,
    created_at: row.category.created_at,
    updated_at: row.category.updated_at,
  },
});

export class TypeOrmTicketRepository extends TicketRepository {
  constructor(
    @InjectRepository(TicketEntity)
    private readonly ticket_repository: Repository<TicketEntity>,
  ) {
    super();
  }

  async findOne(id: string): Promise<TicketListItem | null> {
    const row = await this.ticket_repository
      .createQueryBuilder("ticket")
      .leftJoinAndSelect("ticket.category", "category")
      .leftJoinAndSelect("ticket.profile", "profile")
      .where("ticket.id = :id", { id })
      .getOne();

    if (!row || !row.category) {
      return null;
    }

    return entity_to_list_item(row);
  }

  async find_all(filter: TicketFilter): Promise<PaginatedResult<TicketListItem>> {
    const qb = this.ticket_repository
      .createQueryBuilder("ticket")
      .leftJoinAndSelect("ticket.category", "category")
      .leftJoinAndSelect("ticket.profile", "profile");

    if (filter.profile_id) {
      qb.andWhere("ticket.profile_id = :profile_id", {
        profile_id: filter.profile_id,
      });
    }
    if (filter.status) {
      qb.andWhere("ticket.status = :status", { status: filter.status });
    }
    if (filter.category_id) {
      qb.andWhere("ticket.category_id = :category_id", {
        category_id: filter.category_id,
      });
    }
    if (filter.query?.trim()) {
      qb.andWhere(
        "(ticket.title ILIKE :query OR ticket.description ILIKE :query)",
        { query: `%${filter.query.trim()}%` },
      );
    }

    const order_column =
      filter.order_by !== undefined && TICKET_SORT_KEYS.has(filter.order_by)
        ? filter.order_by
        : "created_at";
    const direction = filter.order_direction ?? "DESC";
    qb.orderBy(`ticket.${order_column}`, direction);

    const page = filter.page;
    const limit = filter.limit;
    qb.skip((page - 1) * limit).take(limit);

    const [rows, total] = await qb.getManyAndCount();
    const data = rows
      .filter((row) => row.category)
      .map((row) => entity_to_list_item(row));

    return new PaginatedResult(data, total, page, limit);
  }

  async save(ticket: Ticket): Promise<Ticket> {
    const primitive = ticket.toPrimitives();
    const saved = await this.ticket_repository.save(
      this.ticket_repository.create({
        id: primitive.id,
        title: primitive.title,
        description: primitive.description,
        file_url: primitive.file_url,
        status: primitive.status,
        category_id: primitive.category.id,
        profile_id: primitive.profile_id,
        created_at: primitive.created_at,
        updated_at: primitive.updated_at,
      }),
    );

    return Ticket.fromPrimitives({
      ...primitive,
      id: saved.id,
      created_at: saved.created_at,
      updated_at: saved.updated_at,
    });
  }

  async update(ticket: Ticket): Promise<void> {
    const primitive = ticket.toPrimitives();
    const row = await this.ticket_repository.preload({
      id: primitive.id,
      title: primitive.title,
      description: primitive.description,
      file_url: primitive.file_url,
      status: primitive.status,
      category_id: primitive.category.id,
      profile_id: primitive.profile_id,
    });
    if (!row) {
      throw new TicketNotFoundException(primitive.id);
    }
    await this.ticket_repository.save(row);
  }

  async delete(id: string): Promise<void> {
    await this.ticket_repository.delete(id);
  }
}
