import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { NotificationChannelDispatcher } from "@/src/contexts/alerts/services/notification-channel-dispatcher.service";
import { ChatMessageService } from "@/src/contexts/chat/services/chat-message.service";
import { ChatService } from "@/src/contexts/chat/services/chat.service";
import { CHAT_TYPE } from "@/src/contexts/chat/types/chat";
import { CHAT_MESSAGE_TYPE } from "@/src/contexts/chat/types/chatMessage";
import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { PaginatedResult } from "@/src/contexts/shared/types/paginated-result.vo";
import { User } from "@/src/contexts/users/entities/user.entity";

import { Ticket, TicketStatus } from "../types/ticket";
import { TicketCategoryNotFoundException } from "../exceptions/ticket-category-not-found.exception";
import { TicketForbiddenException } from "../exceptions/ticket-forbidden.exception";
import { TicketNotFoundException } from "../exceptions/ticket-not-found.exception";
import { TicketFilter } from "../types/ticket.filter";
import { TicketListItem } from "../types/ticket-list-item";
import { TypeOrmTicketRepository } from "../repositories/typeorm.ticket-repository";
import { TicketCategoriesService } from "./ticket-categories.service";

export interface CreateTicketInput {
  profile_id: string;
  category_id: string;
  title: string;
  description: string;
  file_url?: string | null;
}

export interface UpdateTicketInput {
  ticket_id: string;
  profile_id: string;
  category_id?: string;
  title?: string;
  description?: string;
  file_url?: string | null;
  status?: TicketStatus;
}

export interface AdminUpdateTicketInput {
  ticket_id: string;
  category_id?: string;
  title?: string;
  description?: string;
  file_url?: string | null;
  status?: TicketStatus;
}

export interface FindTicketInput {
  ticket_id: string;
  profile_id: string;
}

export interface FindAllTicketsInput {
  profile_id?: string;
  status?: TicketStatus;
  category_id?: string;
  page?: number;
  limit?: number;
  query?: string;
  order_by?: string;
  order_direction?: "ASC" | "DESC";
}

export interface DeleteTicketInput {
  ticket_id: string;
  profile_id: string;
}

const USER_ALLOWED_STATUS: TicketStatus[] = [
  TicketStatus.CLOSED,
  TicketStatus.CANCELLED,
];

@Injectable()
export class TicketsService {
  constructor(
    private readonly ticket_repository: TypeOrmTicketRepository,
    private readonly ticket_categories_service: TicketCategoriesService,
    private readonly chat_service: ChatService,
    private readonly chat_message_service: ChatMessageService,
    private readonly notification_channel_dispatcher: NotificationChannelDispatcher,
    @InjectRepository(User)
    private readonly user_repository: Repository<User>,
  ) {}

  async create(input: CreateTicketInput): Promise<TicketListItem> {
    const category = await this.ticket_categories_service.findById(
      input.category_id,
    );
    if (!category) {
      throw new TicketCategoryNotFoundException(input.category_id);
    }

    const ticket = Ticket.create({
      title: input.title,
      description: input.description,
      file_url: input.file_url,
      category,
      profile_id: input.profile_id,
    });
    await this.ticket_repository.save(ticket);

    const ticket_id = ticket.toPrimitives().id;

    const chat = await this.chat_service.create({
      participants: [input.profile_id],
      chat_type: CHAT_TYPE.SUPPORT,
      vehicle_id: null,
      ticket_id,
    });

    const initial_content = [
      `Ticket: ${input.title}`,
      "",
      input.description,
    ].join("\n");

    await this.chat_message_service.create({
      chat_id: chat.id,
      sender_id: input.profile_id,
      content: initial_content,
      type: CHAT_MESSAGE_TYPE.TEXT,
    });

    if (input.file_url) {
      const is_image = this.isImageUrl(input.file_url);
      await this.chat_message_service.create({
        chat_id: chat.id,
        sender_id: input.profile_id,
        content: input.file_url,
        type: is_image ? CHAT_MESSAGE_TYPE.IMAGE : CHAT_MESSAGE_TYPE.FILE,
        metadata: {
          file_name: input.file_url.split("/").pop() ?? "adjunto",
        },
      });
    }

    await this.notifyAdminsTicketCreated({
      ticket_id,
      title: input.title,
      description: input.description,
      chat_id: chat.id,
      profile_id: input.profile_id,
    });

    const created = await this.ticket_repository.findOne(ticket_id);
    if (!created) {
      throw new Error("Ticket recién creado no encontrado");
    }
    return created;
  }

  async update(input: UpdateTicketInput): Promise<TicketListItem> {
    const existing = await this.ticket_repository.findOne(input.ticket_id);
    if (!existing) {
      throw new TicketNotFoundException(input.ticket_id);
    }
    if (existing.profile_id !== input.profile_id) {
      throw new TicketForbiddenException();
    }

    if (
      input.status !== undefined &&
      !USER_ALLOWED_STATUS.includes(input.status)
    ) {
      throw new TicketForbiddenException();
    }

    return this.applyUpdate(existing, input);
  }

  async updateAsAdmin(input: AdminUpdateTicketInput): Promise<TicketListItem> {
    const existing = await this.ticket_repository.findOne(input.ticket_id);
    if (!existing) {
      throw new TicketNotFoundException(input.ticket_id);
    }
    return this.applyUpdate(existing, input);
  }

  async ensureSupportChat(ticket_id: string): Promise<TicketListItem> {
    const existing = await this.ticket_repository.findOne(ticket_id);
    if (!existing) {
      throw new TicketNotFoundException(ticket_id);
    }

    if (existing.chat_id) {
      return existing;
    }

    const chat = await this.chat_service.create({
      participants: [existing.profile_id],
      chat_type: CHAT_TYPE.SUPPORT,
      vehicle_id: null,
      ticket_id,
    });

    await this.chat_message_service.create({
      chat_id: chat.id,
      sender_id: existing.profile_id,
      content: [`Ticket: ${existing.title}`, "", existing.description].join(
        "\n",
      ),
      type: CHAT_MESSAGE_TYPE.TEXT,
    });

    const refreshed = await this.ticket_repository.findOne(ticket_id);
    if (!refreshed) {
      throw new TicketNotFoundException(ticket_id);
    }
    return refreshed;
  }

  async findOne(input: FindTicketInput): Promise<TicketListItem> {
    const ticket = await this.ticket_repository.findOne(input.ticket_id);
    if (!ticket) {
      throw new TicketNotFoundException(input.ticket_id);
    }
    if (ticket.profile_id !== input.profile_id) {
      throw new TicketForbiddenException();
    }
    return ticket;
  }

  async findOneAdmin(ticket_id: string): Promise<TicketListItem> {
    const ticket = await this.ticket_repository.findOne(ticket_id);
    if (!ticket) {
      throw new TicketNotFoundException(ticket_id);
    }
    return ticket;
  }

  async findAll(
    input: FindAllTicketsInput,
  ): Promise<PaginatedResult<TicketListItem>> {
    const filter = new TicketFilter({
      profile_id: input.profile_id,
      status: input.status,
      category_id: input.category_id,
      page: input.page,
      limit: input.limit,
      query: input.query,
      order_by: input.order_by,
      order_direction: input.order_direction,
    });
    return this.ticket_repository.find_all(filter);
  }

  async remove(input: DeleteTicketInput): Promise<void> {
    const existing = await this.ticket_repository.findOne(input.ticket_id);
    if (!existing) {
      throw new TicketNotFoundException(input.ticket_id);
    }
    if (existing.profile_id !== input.profile_id) {
      throw new TicketForbiddenException();
    }
    await this.ticket_repository.delete(input.ticket_id);
  }

  async removeAsAdmin(ticket_id: string): Promise<void> {
    const existing = await this.ticket_repository.findOne(ticket_id);
    if (!existing) {
      throw new TicketNotFoundException(ticket_id);
    }
    await this.ticket_repository.delete(ticket_id);
  }

  private async applyUpdate(
    existing: TicketListItem,
    input: {
      category_id?: string;
      title?: string;
      description?: string;
      file_url?: string | null;
      status?: TicketStatus;
    },
  ): Promise<TicketListItem> {
    let category = existing.category;
    if (input.category_id && input.category_id !== existing.category.id) {
      const loaded = await this.ticket_categories_service.findById(
        input.category_id,
      );
      if (!loaded) {
        throw new TicketCategoryNotFoundException(input.category_id);
      }
      category = loaded;
    }

    const ticket = Ticket.fromPrimitives({
      id: existing.id,
      title: existing.title,
      description: existing.description,
      file_url: existing.file_url,
      status: existing.status,
      profile_id: existing.profile_id,
      created_at: existing.created_at,
      updated_at: existing.updated_at,
      category,
    });

    const previous_status = existing.status;
    const updated = ticket.update({
      title: input.title,
      description: input.description,
      file_url: input.file_url,
      category,
      status: input.status,
    });
    await this.ticket_repository.update(updated);

    const result = await this.ticket_repository.findOne(existing.id);
    if (!result) {
      throw new TicketNotFoundException(existing.id);
    }

    if (input.status && input.status !== previous_status) {
      await this.notification_channel_dispatcher.notify({
        profile_id: existing.profile_id,
        category: "support_ticket",
        title: "Actualización de tu ticket",
        body: `El estado de «${result.title}» pasó a ${result.status}.`,
        data: {
          ticket_id: result.id,
          chat_id: result.chat_id,
          status: result.status,
        },
      });
    }

    return result;
  }

  private async notifyAdminsTicketCreated(payload: {
    ticket_id: string;
    title: string;
    description: string;
    chat_id: string;
    profile_id: string;
  }): Promise<void> {
    const admins = await this.user_repository.find({
      where: { is_admin: true },
      select: ["id"],
    });

    const excerpt =
      payload.description.trim().length > 160
        ? `${payload.description.trim().slice(0, 157)}...`
        : payload.description.trim();

    await Promise.all(
      admins.map((admin) =>
        this.notification_channel_dispatcher.notify({
          profile_id: admin.id,
          category: "support_ticket",
          title: `Nuevo ticket: ${payload.title}`,
          body: excerpt || payload.title,
          data: {
            ticket_id: payload.ticket_id,
            chat_id: payload.chat_id,
            profile_id: payload.profile_id,
          },
        }),
      ),
    );
  }

  private isImageUrl(url: string): boolean {
    return /\.(png|jpe?g|gif|webp|heic|heif)(\?|$)/i.test(url);
  }
}
