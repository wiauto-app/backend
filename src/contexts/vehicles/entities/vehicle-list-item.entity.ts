import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
  Unique,
} from "typeorm";

import { VehicleEntity } from "./vehicle.entity";
import { VehicleListEntity } from "./vehicle-list.entity";

@Entity({ name: "vehicle_list_items" })
@Unique("UQ_vehicle_list_items_list_vehicle", ["list_id", "vehicle_id"])
export class VehicleListItemEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "vehicle_list_id", type: "uuid" })
  list_id: string;

  @Column({ type: "uuid" })
  vehicle_id: string;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => VehicleListEntity, (vehicle_list) => vehicle_list.items, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "vehicle_list_id" })
  vehicle_list: Relation<VehicleListEntity>;

  @ManyToOne(() => VehicleEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "vehicle_id" })
  vehicle: Relation<VehicleEntity>;
}
