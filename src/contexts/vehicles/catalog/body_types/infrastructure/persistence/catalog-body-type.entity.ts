import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "body_type" })
export class CatalogBodyTypeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  body_type_id: number;

  @Column()
  doors: number;

  @Column()
  name: string;

  @Column()
  slug: string;

  @CreateDateColumn()
  created_at: Date;
}
