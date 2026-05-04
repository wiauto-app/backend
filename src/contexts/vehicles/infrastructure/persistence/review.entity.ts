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
import { PrimitiveReview } from "../../domain/entities/reviews";
import { VehicleEntity } from "./vehicle.entity";
import { Profile } from "../../../profiles/entities/profile.entity";

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

  @ManyToOne(() => Profile, (profile) => profile.reviews, { onDelete: "CASCADE" })
  @JoinColumn({ name: "profile_id" })
  profile: Relation<Profile>;

  @ManyToOne(() => VehicleEntity, (vehicle) => vehicle.reviews, { onDelete: "CASCADE" })
  @JoinColumn({ name: "vehicle_id" })
  vehicle: Relation<VehicleEntity>;
}