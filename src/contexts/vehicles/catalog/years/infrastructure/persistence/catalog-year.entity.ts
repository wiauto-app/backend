import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, Relation } from "typeorm";
import { VersionEntity } from "../../../versions/infrastructure/persistence/version.entity";

@Entity({ name: "year" })
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
