import {
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  Relation,
} from "typeorm";
import { CatalogYearEntity } from "../../years/entities/catalog-year.entity";
import { VersionEntity } from "./version.entity";

/** Par versión–año del catálogo (una versión existe en varios años). */
@Entity({ name: "version_year" })
@Index("IDX_version_year_year_id", ["year_id"])
export class VersionYearEntity {
  @PrimaryColumn({ type: "int" })
  version_id: number;

  @PrimaryColumn({ type: "int" })
  year_id: number;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => VersionEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "version_id" })
  version: Relation<VersionEntity>;

  @ManyToOne(() => CatalogYearEntity)
  @JoinColumn({ name: "year_id" })
  year: Relation<CatalogYearEntity>;
}
