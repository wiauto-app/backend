import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from "typeorm";

import { ProfileEntity } from "@/src/contexts/profiles/infrastructure/persistence/profile.entity";

import {
  CONTACT_CLICK_TYPE,
  ContactClickType,
  PrimitiveContactClick,
} from "../../domain/entities/contact-click";
import { VehicleEntity } from "./vehicle.entity";

@Entity({ name: "vehicle_contact_clicks" })
export class ContactClickEntity implements PrimitiveContactClick {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  vehicle_id: string;

  @Column({ type: "uuid", nullable: true })
  profile_id: string | null;

  @Column({ type: "enum", enum: CONTACT_CLICK_TYPE })
  type: ContactClickType;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => VehicleEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "vehicle_id" })
  vehicle: Relation<VehicleEntity>;

  @ManyToOne(() => ProfileEntity, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "profile_id" })
  profile: Relation<ProfileEntity | null>;
}
