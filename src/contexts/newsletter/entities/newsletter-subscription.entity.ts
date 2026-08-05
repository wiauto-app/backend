import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from "typeorm";

import { ProfileEntity } from "@/src/contexts/profiles/entities/profile.entity";

@Entity({ name: "newsletter_subscriptions" })
export class NewsletterSubscriptionEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index({ unique: true })
  @Column({ unique: true })
  email: string;

  @Column({ type: "uuid", nullable: true })
  profile_id: string | null;

  @ManyToOne(() => ProfileEntity, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({
    name: "profile_id",
    foreignKeyConstraintName: "FK_newsletter_subscriptions_profile_id",
  })
  profile: Relation<ProfileEntity> | null;

  @Column({ type: "text", array: true, default: () => "'{}'" })
  enabled_category_slugs: string[];

  @Column({ default: true })
  channel_email: boolean;

  @Column({ default: true })
  channel_push: boolean;

  @Column({ default: true })
  channel_in_app: boolean;

  @Column({ default: false })
  channel_whatsapp: boolean;

  @Column({ default: false })
  channel_sms: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
