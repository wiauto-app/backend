import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from "typeorm";

import { TicketEntity } from "@/src/contexts/support/entities/ticket.entity";

import { CHAT_TYPE, ChatType } from "../types/chat";
import { ChatMessageEntity } from "./chat-message.orm.entity";

@Entity({ name: "chats" })
export class ChatEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "jsonb", default: [] })
  participants: string[];

  @Column({ type: "enum", enum: Object.values(CHAT_TYPE) })
  chat_type: ChatType;

  @Column({ type: "uuid", nullable: true })
  vehicle_id: string | null;

  @Column({ type: "uuid", nullable: true, unique: true })
  ticket_id: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => ChatMessageEntity, (message: ChatMessageEntity) => message.chat)
  messages: Relation<ChatMessageEntity[]>;

  @OneToOne(() => TicketEntity, (ticket) => ticket.chat, {
    onDelete: "SET NULL",
    nullable: true,
  })
  @JoinColumn({ name: "ticket_id" })
  ticket: Relation<TicketEntity> | null;
}
