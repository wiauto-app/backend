import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { PrimitiveDgtLabel } from "../../domain/entities/dgt-label";

@Entity({ name: "dgt_labels" })
export class DgtLabelEntity implements PrimitiveDgtLabel {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  code: string;

  @Column({ type: "text" })
  description: string;

  @Column()
  slug: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
