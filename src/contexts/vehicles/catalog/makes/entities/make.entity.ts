import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, Relation } from "typeorm";
import { Model } from "../../models/entities/model.entity";
import { Version } from "../../versions/entities/version.entity";

@Entity()
export class Make {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  section_1_id: number;

  @Column()
  name: string;

  @OneToMany(() => Model, (model) => model.make)
  models: Relation<Model[]>;

  @OneToMany(() => Version, (version) => version.make)
  versions: Relation<Version[]>;

  @CreateDateColumn()
  created_at: Date;
}
