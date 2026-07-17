import { ProfileEntity } from "@/src/contexts/profiles/entities/profile.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Relation, UpdateDateColumn } from "typeorm";
import { DealershipEntity } from "./dealership.entity";


@Entity({ name: "dealership_members" })
export class DealershipMembersEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  dealership_id: string;

  @Column()
  profile_id: string;

  @Column()
  role: "owner" | "admin" | "member";

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => DealershipEntity, (dealership) => dealership.members, { onDelete: "CASCADE" })
  @JoinColumn({
    name: "dealership_id",
  })
  dealership: Relation<DealershipEntity>;

  @ManyToOne(() => ProfileEntity, (profile) => profile.dealership_members, { onDelete: "CASCADE" })
  @JoinColumn({
    name: "profile_id",
  })
  profile: Relation<ProfileEntity>;
}