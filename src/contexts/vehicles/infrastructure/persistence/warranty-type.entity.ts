import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { PrimitiveWarrantyType } from "../../domain/entities/warranty-type";

@Entity({ name: "warranty_types" })
export class WarrantyTypeEntity implements PrimitiveWarrantyType {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column({ type: "text" })
  description: string;

  @Column()
  slug: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
