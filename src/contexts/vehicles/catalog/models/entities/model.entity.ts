import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, Relation } from "typeorm";
import { Make } from "../../makes/entities/make.entity";
import { Version } from "../../versions/entities/version.entity";

@Entity()
export class Model {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  make_id: number;

  @ManyToOne(() => Make, (make) => make.models)
  @JoinColumn({ name: "make_id" })
  make: Relation<Make>;

  @Column()
  model_id: number;

  @Column()
  name: string;

  @OneToMany(() => Version, (version) => version.model)
  versions: Relation<Version[]>;

  @CreateDateColumn()
  created_at: Date;
}
