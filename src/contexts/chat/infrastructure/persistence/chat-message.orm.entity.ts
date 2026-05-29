import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from "typeorm";

import {
  CHAT_MESSAGE_STATUS,
  CHAT_MESSAGE_TYPE,
  ChatMessageStatus,
  ChatMessageType,
} from "../../domain/entities/chatMessage";
import { ChatMessageMetadata } from "../../domain/entities/chatMessageMetadata";
import { ChatEntity } from "./chat.entity";

@Entity({ name: "chat_messages" })
export class ChatMessageEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  chat_id: string;

  @ManyToOne(() => ChatEntity, (chat) => chat.messages, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "chat_id" })
  chat: Relation<ChatEntity>;

  @Column({ type: "uuid" })
  sender_id: string;

  @Column({ type: "text" })
  content: string;

  @Column({ type: "enum", enum: Object.values(CHAT_MESSAGE_TYPE) })
  type: ChatMessageType;

  @Column({ type: "enum", enum: Object.values(CHAT_MESSAGE_STATUS) })
  status: ChatMessageStatus;

  @Column({ type: "jsonb", nullable: true })
  metadata: ChatMessageMetadata | null;

  @Column({ type: "timestamptz", nullable: true })
  edited_at: Date | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn({ nullable: true })
  deleted_at: Date | null;
}

