import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "year" })
export class CatalogYearEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  year: number;

  @Column()
  slug: string;

  @CreateDateColumn()
  created_at: Date;
}
