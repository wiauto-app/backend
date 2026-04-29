import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "model" })
export class CatalogModelEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  make_id: number;

  @Column()
  model_id: number;

  @Column()
  name: string;

  @Column()
  slug: string;

  @CreateDateColumn()
  created_at: Date;
}
