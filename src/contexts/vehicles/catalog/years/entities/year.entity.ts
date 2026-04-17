import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, Relation } from "typeorm";
import { Version } from "../../versions/entities/version.entity";

@Entity()
export class Year {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  year: number;

  @OneToMany(() => Version, (version) => version.year)
  versions: Relation<Version[]>;

  @CreateDateColumn()
  created_at: Date;
}
