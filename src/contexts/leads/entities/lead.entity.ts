import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

/** Tabla "generic_leads": distinta de "leads" (contactos de vehículo, contexts/vehicles). */
@Entity({ name: "generic_leads" })
export class GenericLeadEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  /** Discriminador del formulario/feature de origen (ej. "seguros"). String libre, sin enum, para no requerir migración por cada formulario nuevo. */
  @Index()
  @Column()
  type!: string;

  @Column()
  first_name!: string;

  @Column()
  last_name!: string;

  @Column({ type: "varchar", nullable: true })
  dni!: string | null;

  @Column()
  phone!: string;

  @Column()
  email!: string;

  /** Datos específicos de cada formulario (ids seleccionados, matrícula, etc.). */
  @Column({ type: "jsonb", default: {} })
  extra_data!: Record<string, unknown>;

  @Column({ default: "pending" })
  status!: string;

  @CreateDateColumn({ name: "created_at" })
  created_at!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updated_at!: Date;
}
