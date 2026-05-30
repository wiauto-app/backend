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
import { ProfileEntity } from "@/src/contexts/profiles/infrastructure/persistence/profile.entity";
import { PrimitiveDealershipReview } from "../../domain/entities/dealership-review";
import { DealershipEntity } from "./dealership.entity";

@Entity({ name: "dealership_reviews" })
export class DealershipReviewEntity implements PrimitiveDealershipReview {
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
  dealership_id: string;

  @ManyToOne(() => ProfileEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "profile_id" })
  profile: Relation<ProfileEntity>;

  @ManyToOne(() => DealershipEntity, (dealership) => dealership.reviews, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "dealership_id" })
  dealership: Relation<DealershipEntity>;
}
