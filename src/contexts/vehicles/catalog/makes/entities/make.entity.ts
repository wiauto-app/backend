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

@Entity({ name: "make" })
@Index("UQ_make_section_1_id", ["section_1_id"], {
  unique: true,
  where: `"section_1_id" IS NOT NULL`,
})
export class MakeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  /** Identificador externo del crawl (`section_1_id`). */
  @Column({ type: "int", nullable: true })
  section_1_id: number | null;

  @Column()
  name: string;

  @Column()
  slug: string;

  @Column({ name: "image_url", type: "varchar", nullable: true })
  image_url: string | null;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => VersionEntity, (version) => version.make)
  versions: Relation<VersionEntity[]>;
}
