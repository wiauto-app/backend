import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from "typeorm";

import {
  VEHICLE_PRICE_STATUS,
  VehiclePriceStatus,
} from "../types/vehicle-price";
import { VehicleEntity } from "../../entities/vehicle.entity";

@Entity({ name: "vehicle_prices" })
export class VehiclePriceEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "integer" })
  price: number;

  @Column({
    type: "enum",
    enum: VEHICLE_PRICE_STATUS,
    default: VEHICLE_PRICE_STATUS.ACTIVE,
  })
  status: VehiclePriceStatus;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => VehicleEntity, (vehicle) => vehicle.vehicle_prices, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "vehicle_id" })
  vehicle: Relation<VehicleEntity>;

  @Column({ type: "uuid" })
  vehicle_id: string;
}
