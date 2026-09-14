import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
  Unique,
} from "typeorm";

import { ProfileEntity } from "@/src/contexts/profiles/entities/profile.entity";

@Entity({ name: "user_blocks" })
@Unique("UQ_user_blocks_blocker_blocked", [
  "blocker_profile_id",
  "blocked_profile_id",
])
@Check(
  "CHK_user_blocks_not_self",
  `"blocker_profile_id" <> "blocked_profile_id"`,
)
export class UserBlockEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  @Index("IDX_user_blocks_blocker_profile_id")
  blocker_profile_id: string;

  @Column({ type: "uuid" })
  @Index("IDX_user_blocks_blocked_profile_id")
  blocked_profile_id: string;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => ProfileEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "blocker_profile_id" })
  blocker_profile: Relation<ProfileEntity>;

  @ManyToOne(() => ProfileEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "blocked_profile_id" })
  blocked_profile: Relation<ProfileEntity>;
}
