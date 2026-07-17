import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from "typeorm";
import { PrimitiveReview } from "../types/reviews";
import { VehicleEntity } from "./vehicle.entity";
import { ProfileEntity } from "@/src/contexts/profiles/entities/profile.entity";

@Entity({ name: "reviews" })
export class ReviewEntity implements PrimitiveReview {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  rating: number;

  @Column()
  comment: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column()
  profile_id: string;

  @Column()
  vehicle_id: string;

  @ManyToOne(() => ProfileEntity, (profile) => profile.reviews, { onDelete: "CASCADE" })
  @JoinColumn({ name: "profile_id" })
  profile: Relation<ProfileEntity>;

  @ManyToOne(() => VehicleEntity, (vehicle) => vehicle.reviews, { onDelete: "CASCADE" })
  @JoinColumn({ name: "vehicle_id" })
  vehicle: Relation<VehicleEntity>;
}