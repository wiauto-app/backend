import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, Relation } from "typeorm";
import { VersionEntity } from "../../../versions/infrastructure/persistence/version.entity";

@Entity({ name: "make" })
export class MakeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  slug: string;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => VersionEntity, (version) => version.make)
  versions: Relation<VersionEntity[]>;
}
