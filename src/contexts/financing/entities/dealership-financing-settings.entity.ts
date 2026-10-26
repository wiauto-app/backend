import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from "typeorm";

import { DealershipEntity } from "@/src/contexts/dealership/entities/dealership.entity";

const numericTransformer = {
  to: (value: number | null | undefined): number | null | undefined => value,
  from: (value: string | number | null): number | null =>
    value === null ? null : Number(value),
};

@Entity({ name: "dealership_financing_settings" })
export class DealershipFinancingSettingsEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  dealership_id: string;

  @Column({ type: "boolean", default: false })
  enabled: boolean;

  @Column({ type: "varchar", length: 120, nullable: true })
  financial_entity: string | null;

  /** TIN anual (%) usado para calcular la cuota. */
  @Column({
    type: "numeric",
    precision: 5,
    scale: 2,
    default: 0,
    transformer: numericTransformer,
  })
  tin: number;

  /** TAE (%) declarada por el concesionario; solo se muestra. */
  @Column({
    type: "numeric",
    precision: 5,
    scale: 2,
    nullable: true,
    transformer: numericTransformer,
  })
  declared_tae: number | null;

  @Column({ type: "int", default: 12 })
  min_term_months: number;

  @Column({ type: "int", default: 84 })
  max_term_months: number;

  @Column({ type: "int", default: 60 })
  default_term_months: number;

  @Column({
    type: "numeric",
    precision: 5,
    scale: 2,
    default: 20,
    transformer: numericTransformer,
  })
  default_down_payment_percent: number;

  @Column({
    type: "numeric",
    precision: 5,
    scale: 2,
    default: 10,
    transformer: numericTransformer,
  })
  min_down_payment_percent: number;

  @Column({
    type: "numeric",
    precision: 5,
    scale: 2,
    default: 50,
    transformer: numericTransformer,
  })
  max_down_payment_percent: number;

  @Column({
    type: "numeric",
    precision: 12,
    scale: 2,
    default: 3000,
    transformer: numericTransformer,
  })
  min_financeable_amount: number;

  /** Comisión de apertura en % del capital. */
  @Column({
    type: "numeric",
    precision: 5,
    scale: 2,
    default: 0,
    transformer: numericTransformer,
  })
  opening_fee_percent: number;

  /** Comisión de apertura fija en euros. */
  @Column({
    type: "numeric",
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: numericTransformer,
  })
  opening_fee_fixed: number | null;

  @Column({ type: "text", nullable: true })
  other_conditions: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToOne(() => DealershipEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "dealership_id" })
  dealership: Relation<DealershipEntity>;
}
