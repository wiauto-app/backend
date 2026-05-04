import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("suspension_duration_types")
export class SuspensionDurationType {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index({ unique: true })
  @Column({ type: "varchar", unique: true })
  key: string;

  @Column({ type: "varchar" })
  label: string;

  /** Milisegundos a sumar desde `suspended_at`; `null` = suspensión indefinida hasta levantarla a mano. */
  @Column({ type: "bigint", nullable: true })
  duration_ms: string | null;

  @Column({ type: "boolean", default: true })
  is_active: boolean;

  @Column({ type: "int", default: 0 })
  sort_order: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
