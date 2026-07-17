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

@Entity({ name: "model" })
@Index("IDX_model_make_id", ["make_id"])
@Index("UQ_model_make_id_model_id", ["make_id", "model_id"], { unique: true })
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
