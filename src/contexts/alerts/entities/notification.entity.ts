import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from "typeorm";

import { ProfileEntity } from "@/src/contexts/profiles/entities/profile.entity";

@Entity({ name: "notifications" })
export class NotificationEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  profile_id: string;

  @ManyToOne(() => ProfileEntity, { onDelete: "CASCADE" })
  @JoinColumn({
    name: "profile_id",
    foreignKeyConstraintName: "FK_notifications_profile_id",
  })
  profile: Relation<ProfileEntity>;

  @Column()
  category: string;

  @Column()
  title: string;

  @Column({ type: "text" })
  body: string;

  @Column({ type: "jsonb", nullable: true })
  data: Record<string, unknown> | null;

  @Column({ type: "timestamptz", nullable: true })
  read_at: Date | null;

  @CreateDateColumn()
  created_at: Date;
}
