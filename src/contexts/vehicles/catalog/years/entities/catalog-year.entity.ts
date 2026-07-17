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

@Entity({ name: "year" })
@Index("UQ_year_year", ["year"], { unique: true })
export class CatalogYearEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  year: number;

  @Column()
  slug: string;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => VersionEntity, (version) => version.year)
  versions: Relation<VersionEntity[]>;
}
