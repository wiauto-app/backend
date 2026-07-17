import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
} from "typeorm";

import { ProfileEntity } from "@/src/contexts/profiles/entities/profile.entity";

import { PrimitiveList } from "../types/list";
import { VehicleListItemEntity } from "./vehicle-list-item.entity";

@Entity({ name: "vehicle_lists" })
export class VehicleListEntity implements PrimitiveList {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  profile_id: string;

  @Column({ default: false })
  is_default: boolean;

  @Column()
  name: string;

  @Column({ type: "varchar", nullable: true })
  description: string | null;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => ProfileEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "profile_id" })
  profile: Relation<ProfileEntity>;

  @OneToMany(() => VehicleListItemEntity, (item) => item.vehicle_list)
  items?: Relation<VehicleListItemEntity[]>;
}
