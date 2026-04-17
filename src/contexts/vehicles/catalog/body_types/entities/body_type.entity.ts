import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, Relation } from "typeorm";
import { Version } from "../../versions/entities/version.entity";

@Entity()
export class BodyType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  body_type_id: number;

  @Column()
  doors: number;

  @Column()
  name: string;

  @OneToMany(() => Version, (version) => version.body_type)
  versions: Relation<Version[]>;

  @CreateDateColumn()
  created_at: Date;
}
