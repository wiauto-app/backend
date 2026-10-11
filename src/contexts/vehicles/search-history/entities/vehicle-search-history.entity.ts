import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
  Unique,
} from "typeorm";

import { User } from "@/src/contexts/users/entities/user.entity";

import type { VehicleSearchQuery } from "../types/vehicle-search-query";

@Entity({ name: "vehicle_search_history" })
@Unique("UQ_vehicle_search_history_user_query_hash", ["user_id", "query_hash"])
/** (user_id, last_searched_at DESC): definido en la migración, TypeORM no lo sincroniza. */
@Index("IDX_vehicle_search_history_user_last_searched", { synchronize: false })
export class VehicleSearchHistoryEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  user_id: string;

  /** Parámetros normalizados de GET /v1/vehicles (sin paginación ni orden). */
  @Column({ type: "jsonb" })
  query: VehicleSearchQuery;

  /** sha256 hex de `query` serializado con claves ordenadas. */
  @Column({ type: "varchar", length: 64 })
  query_hash: string;

  @Column({ type: "varchar", length: 255 })
  label: string;

  @Column({ type: "int" })
  filters_count: number;

  @Column({ type: "int", nullable: true })
  results_count: number | null;

  @Column({ type: "int", default: 1 })
  search_count: number;

  @Column({ type: "timestamptz" })
  last_searched_at: Date;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({
    name: "user_id",
    foreignKeyConstraintName: "FK_vehicle_search_history_user_id",
  })
  user: Relation<User>;
}
