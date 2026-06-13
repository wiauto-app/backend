import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, Relation } from "typeorm";
import { VersionEntity } from "../../../versions/infrastructure/persistence/version.entity";

@Entity({ name: "model" })
export class CatalogModelEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  make_id: number;

  @Column()
  model_id: number;

  @Column()
  name: string;

  @Column()
  slug: string;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => VersionEntity, (version) => version.model)
  versions: Relation<VersionEntity[]>;
}
