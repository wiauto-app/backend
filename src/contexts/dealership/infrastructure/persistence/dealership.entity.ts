import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, Relation, UpdateDateColumn } from "typeorm";
import { DealershipMembersEntity } from "./dealership-members.entity";
import { DealershipInvitationsEntity } from "./dealership-invitations.entity";
import { DealershipReviewEntity } from "./dealership-review.entity";


@Entity({ name: "dealerships" })
export class DealershipEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column()
  slug: string;

  @Column({ nullable: true })
  avatar_url?: string;

  @Column({ nullable: true })
  banner_url?: string;

  @Column()
  description: string;

  @Column({ nullable: true })
  website_url?: string;

  @Column()
  email: string;

  @Column()
  phone_code: string;

  @Column()
  phone: string;

  @Column()
  address: string;

  @Column("decimal", { precision: 10, scale: 8, nullable: true })
  lat?: number;

  @Column("decimal", { precision: 11, scale: 8, nullable: true })
  lng?: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => DealershipMembersEntity, (dealership_members) => dealership_members.dealership)
  members: Relation<DealershipMembersEntity[]>;

  @OneToMany(() => DealershipInvitationsEntity, (dealership_invitations) => dealership_invitations.dealership)
  invitations: Relation<DealershipInvitationsEntity[]>;

  @OneToMany(() => DealershipReviewEntity, (review) => review.dealership)
  reviews: Relation<DealershipReviewEntity[]>;
}