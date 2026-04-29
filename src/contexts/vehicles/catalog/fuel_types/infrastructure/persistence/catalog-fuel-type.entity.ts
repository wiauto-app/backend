import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "fuel_type" })
export class CatalogFuelTypeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  fuel_id: number;

  @Column()
  name: string;

  @Column()
  slug: string;

  @Column({ default: false })
  can_charge: boolean;

  @CreateDateColumn()
  created_at: Date;
}
