import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from "typeorm";

import { slugify } from "@/src/contexts/shared/slugify-string/slugify";

@Entity("provinces")
export class Provinces {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  ogc_fid: number;

  @Column()
  cod_prov: string;

  @Column()
  name: string;

  @Column()
  cod_ccaa: string;

  @Index({ unique: true })
  @Column({ type: "varchar" })
  slug: string;

  @Column({ nullable: true })
  cartodb_id: number;

  @Index({ spatial: true })
  @Column({
    type: "geometry",
    spatialFeatureType: "MultiPolygon",
    srid: 4326,
  })
  geom: string;

  @BeforeInsert()
  @BeforeUpdate()
  private sync_slug_from_name(): void {
    const name_trim = this.name.trim();
    const base = name_trim || `prov-${this.cod_prov}`;
    this.slug = slugify(base) || slugify(`prov-${this.cod_prov}`);
  }
}
