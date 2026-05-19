import { ProfileEntity } from "@/src/contexts/profiles/infrastructure/persistence/profile.entity";
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

import { DealershipEntity } from "./dealership.entity";

@Entity({ name: "dealership_invitations" })
export class DealershipInvitationsEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  email: string;

  @Column()
  role:  "owner" | "admin" | "member";;

  @Index({ unique: true })
  @Column({ unique: true })
  token_hash: string;

  @Column()
  status: "pending" | "accepted" | "revoked" | "expired";

  @Column({ type: "timestamp" })
  expires_at: Date;

  @Column({ type: "timestamp", nullable: true })
  accepted_at: Date | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: "uuid" })
  dealership_id: string;

  @Column({ type: "uuid" })
  invited_by_id: string;

  @ManyToOne(() => ProfileEntity, (profile) => profile.dealership_invitations, { onDelete: "CASCADE" })
  @JoinColumn({ name: "invited_by_id" })
  invited_by: Relation<ProfileEntity>;

  @ManyToOne(() => DealershipEntity, (dealership) => dealership.invitations, { onDelete: "CASCADE" })
  @JoinColumn({ name: "dealership_id" })
  dealership: Relation<DealershipEntity>;
}