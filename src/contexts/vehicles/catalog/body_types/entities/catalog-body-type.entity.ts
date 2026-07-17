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

@Entity({ name: "body_type" })
@Index("UQ_body_type_body_type_id_doors", ["body_type_id", "doors"], {
  unique: true,
})
export class CatalogBodyTypeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  body_type_id: number;

  @Column()
  doors: number;

  @Column()
  name: string;

  @Column()
  slug: string;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => VersionEntity, (version) => version.body_type)
  versions: Relation<VersionEntity[]>;
}
