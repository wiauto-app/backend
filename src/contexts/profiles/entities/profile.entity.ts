import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryColumn, Relation } from "typeorm";
import { User } from "../../users/entities/user.entity";
import { VehicleEntity } from "../../vehicles/infrastructure/persistence/vehicle.entity";
import { Roles } from "../../roles/entities/roles.entity";
import { ReviewEntity } from "../../vehicles/infrastructure/persistence/review.entity";

@Entity()
export class Profile {

  @PrimaryColumn("uuid")
  id!: string;

  @OneToOne(() => User, {
    onDelete: "CASCADE"
  })
  @JoinColumn({ name: "id" })
  user!: User;

  @Column({ nullable: true })
  name?: string;

  @Column({ nullable: true })
  last_name?: string;

  @Column({ nullable: true })
  avatar_url: string;

  @Column({ nullable: true })
  image_url: string

  @OneToMany(() => VehicleEntity, (vehicle) => vehicle.profile)
  vehicles: Relation<VehicleEntity[]>;

  @ManyToOne(() => Roles, (role) => role.profiles, { nullable: true })
  @JoinColumn({ name: "role_id" })
  role: Relation<Roles | null>;

  @OneToMany(() => ReviewEntity, (review) => review.profile)
  reviews: Relation<ReviewEntity[]>;
}