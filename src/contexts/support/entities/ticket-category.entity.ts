import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from "typeorm";

import { PrimitiveTicketCategory } from "../types/ticket-category";
import { TicketEntity } from "./ticket.entity";

@Entity({ name: "ticket_categories" })
export class TicketCategoryEntity implements PrimitiveTicketCategory {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ unique: true })
  slug: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => TicketEntity, (ticket) => ticket.category)
  tickets: Relation<TicketEntity[]>;
}
