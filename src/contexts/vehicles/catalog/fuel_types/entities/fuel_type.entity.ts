import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, Relation } from "typeorm";
import { Version } from "../../versions/entities/version.entity";

@Entity()
export class FuelType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  fuel_id: number;

  @Column()
  name: string;

  @OneToMany(() => Version, (version) => version.fuel_type)
  versions: Relation<Version[]>;

  @CreateDateColumn()
  created_at: Date;
}
