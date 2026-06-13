import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, Relation } from "typeorm";
import { VersionEntity } from "../../../versions/infrastructure/persistence/version.entity";

@Entity({ name: "body_type" })
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
