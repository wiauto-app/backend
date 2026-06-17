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

import { DealershipInvitationsEntity } from "@/src/contexts/dealership/infrastructure/persistence/dealership-invitations.entity";
import { DealershipMembersEntity } from "@/src/contexts/dealership/infrastructure/persistence/dealership-members.entity";
import { Roles } from "@/src/contexts/roles/entities/roles.entity";
import { ReviewEntity } from "@/src/contexts/vehicles/infrastructure/persistence/review.entity";
import { VehicleEntity } from "@/src/contexts/vehicles/infrastructure/persistence/vehicle.entity";
import type { User } from "@/src/contexts/users/entities/user.entity";
import { VehicleListEntity } from "@/src/contexts/vehicles/infrastructure/persistence/vehicle-list.entity";

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

  @Column({ nullable: true })
  last_name?: string;

  @Column({ type: "varchar", nullable: true })
  phone_code: string | null;

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
