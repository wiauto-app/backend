import { Profile } from "@/src/contexts/profiles/entities/profile.entity";
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
  role: string;

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

  @ManyToOne(() => Profile, (profile) => profile.dealership_invitations)
  @JoinColumn({ name: "invited_by_id" })
  invited_by: Relation<Profile>;

  @ManyToOne(() => DealershipEntity, (dealership) => dealership.invitations)
  @JoinColumn({ name: "dealership_id" })
  dealership: Relation<DealershipEntity>;
}