import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from "typeorm";

import { ProfileEntity } from "@/src/contexts/profiles/entities/profile.entity";

import {
  CONTACT_CLICK_TYPE,
  ContactClickType,
  PrimitiveContactClick,
} from "../types/contact-click";
import { VehicleEntity } from "./vehicle.entity";

@Entity({ name: "vehicle_contact_clicks" })
@Index("IDX_vehicle_contact_clicks_vehicle_id", ["vehicle_id"])
@Index("IDX_vehicle_contact_clicks_created_at", ["created_at"])
export class ContactClickEntity implements PrimitiveContactClick {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  vehicle_id: string;

  @Column({ type: "uuid", nullable: true })
  profile_id: string | null;

  @Column({
    type: "enum",
    enum: CONTACT_CLICK_TYPE,
    enumName: "vehicle_contact_click_type",
  })
  type: ContactClickType;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => VehicleEntity, { onDelete: "CASCADE" })
  @JoinColumn({
    name: "vehicle_id",
    foreignKeyConstraintName: "FK_vehicle_contact_clicks_vehicle_id",
  })
  vehicle: Relation<VehicleEntity>;

  @ManyToOne(() => ProfileEntity, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({
    name: "profile_id",
    foreignKeyConstraintName: "FK_vehicle_contact_clicks_profile_id",
  })
  profile: Relation<ProfileEntity | null>;
}
