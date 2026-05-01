import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from "typeorm";

import { slugify } from "@/src/contexts/shared/slugify-string/slugify";

@Entity("communities")
export class Comunity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  ogc_fid: number;

  @Column()
  cod_ccaa: string;

  @Column({ type: "varchar", nullable: true })
  noml_ccaa: string | null;

  @Column({ type: "varchar", nullable: true })
  name: string | null;

  @Index({ unique: true })
  @Column({ type: "varchar" })
  slug: string;

  @Column({ nullable: true })
  cartodb_id: number;

  @Column({
    type: "geometry",
    spatialFeatureType: "MultiPolygon",
    srid: 4326,
  })
  geom: string;

  @BeforeInsert()
  @BeforeUpdate()
  private sync_slug_from_name(): void {
    const name_trim = (this.name ?? "").trim();
    const noml_trim = (this.noml_ccaa ?? "").trim();
    const base = name_trim || noml_trim || `ccaa-${this.cod_ccaa}`;
    this.slug = slugify(base) || slugify(`ccaa-${this.cod_ccaa}`);
  }
}
