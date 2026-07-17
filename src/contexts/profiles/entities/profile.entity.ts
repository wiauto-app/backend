import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryColumn,
  Relation,
} from "typeorm";

import { DealershipInvitationsEntity } from "@/src/contexts/dealership/entities/dealership-invitations.entity";
import { DealershipMembersEntity } from "@/src/contexts/dealership/entities/dealership-members.entity";
import { Roles } from "@/src/contexts/roles/entities/roles.entity";
import { ReviewEntity } from "@/src/contexts/vehicles/entities/review.entity";
import { VehicleEntity } from "@/src/contexts/vehicles/entities/vehicle.entity";
import type { User } from "@/src/contexts/users/entities/user.entity";
import { VehicleListEntity } from "@/src/contexts/vehicles/entities/vehicle-list.entity";
import { PUBLISHER_TYPE, PublisherType } from "@/src/contexts/vehicles/types/vehicle";

@Entity({ name: "profile" })
export class ProfileEntity {
  @PrimaryColumn("uuid")
  id!: string;

  @OneToOne("User", {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "id" })
  user!: Relation<User>;

  @Column()
  name: string;

  @Column({ type: "varchar", nullable: true })
  dni: string | null;

  @Column({ name: "role_id", nullable: true })
  role_id: string;

  @Column({ name: "stripe_customer_id", type: "varchar", nullable: true })
  stripe_customer_id: string | null;

  @Column({ name: "assistant_purchased_credits", type: "int", default: 0 })
  assistant_purchased_credits: number;

  @Column({ name: "assistant_monthly_free_used", type: "int", default: 0 })
  assistant_monthly_free_used: number;

  @Column({ name: "assistant_quota_period_start", type: "timestamptz", nullable: true })
  assistant_quota_period_start: Date | null;

  @Column({ nullable: true })
  last_name?: string;

  @Column({ type: "varchar", nullable: true })
  phone_code: string | null;

  @Column({ type: "enum", enum: PUBLISHER_TYPE, default: PUBLISHER_TYPE.PARTICULAR })
  type: PublisherType;

  @Column({ type: "varchar", nullable: true })
  phone: string | null;

  @Column({ nullable: true })
  avatar_url?: string;

  @Column({ nullable: true })
  image_url?: string;

  @OneToMany(() => VehicleEntity, (vehicle) => vehicle.profile)
  vehicles: Relation<VehicleEntity[]>;

  @ManyToOne(() => Roles, (role) => role.profiles, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "role_id" })
  role: Relation<Roles | null>;

  @OneToMany(() => ReviewEntity, (review) => review.profile)
  reviews: Relation<ReviewEntity[]>;

  @OneToMany(() => DealershipMembersEntity, (dealership_members) => dealership_members.profile)
  dealership_members: Relation<DealershipMembersEntity[]>;

  @OneToMany(
    () => DealershipInvitationsEntity,
    (dealership_invitations) => dealership_invitations.invited_by,
  )
  dealership_invitations: Relation<DealershipInvitationsEntity[]>;

  @OneToMany(() => VehicleListEntity, (vehicle_list) => vehicle_list.profile)
  vehicle_lists: Relation<VehicleListEntity[]>;
}
