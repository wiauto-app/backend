import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
} from "typeorm";
import { VersionEntity } from "../../versions/entities/version.entity";

@Entity({ name: "fuel_type" })
@Index("UQ_fuel_type_fuel_id", ["fuel_id"], { unique: true })
export class CatalogFuelTypeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  fuel_id: number;

  @Column()
  name: string;

  @Column()
  slug: string;

  @Column({ default: false })
  can_charge: boolean;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => VersionEntity, (version) => version.fuel_type)
  versions: Relation<VersionEntity[]>;
}
