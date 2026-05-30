import { ProfileEntity } from "@/src/contexts/profiles/infrastructure/persistence/profile.entity";
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from "typeorm";

import { TicketStatus } from "../../domain/entities/ticket";
import { TicketCategoryEntity } from "./ticket-category.entity";

@Entity({ name: "tickets" })
export class TicketEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  title: string;

  @Column({ type: "text" })
  description: string;

  @Column({ type: "varchar", nullable: true })
  file_url: string | null;

  @Column({
    type: "enum",
    enum: TicketStatus,
    default: TicketStatus.OPEN,
  })
  status: TicketStatus;

  @Column()
  category_id: string;

  @Column()
  profile_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => TicketCategoryEntity, (category) => category.tickets, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "category_id" })
  category: Relation<TicketCategoryEntity>;

  @ManyToOne(() => ProfileEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "profile_id" })
  profile: Relation<ProfileEntity>;
}
