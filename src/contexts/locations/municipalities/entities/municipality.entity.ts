import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from "typeorm";

import { slugify } from "@/src/contexts/shared/slugify-string/slugify";

@Entity("municipalities")
export class Municipality {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", nullable: true })
  name: string | null;

  @Column({ type: "varchar", nullable: true })
  ineCode: string | null;

  @Column({ type: "varchar", nullable: true })
  nuts1: string | null;

  @Column({ type: "varchar", nullable: true })
  nuts2: string | null;

  @Column({ type: "varchar", nullable: true })
  nuts3: string | null;

  @Index({ unique: true })
  @Column({ type: "varchar" })
  slug: string;

  @Index({ spatial: true })
  @Column({ type: "geometry", spatialFeatureType: "MultiPolygon", srid: 4326 })
  geom: string;

  @BeforeInsert()
  @BeforeUpdate()
  private sync_slug_from_identifiers(): void {
    const name_trim = (this.name ?? "").trim();
    const ine_trim = (this.ineCode ?? "").trim();
    const nuts3_trim = (this.nuts3 ?? "").trim();
    const nuts2_trim = (this.nuts2 ?? "").trim();
    const nuts1_trim = (this.nuts1 ?? "").trim();
    const base =
      name_trim ||
      (ine_trim ? `mun-${ine_trim}` : "") ||
      nuts3_trim ||
      nuts2_trim ||
      nuts1_trim ||
      (this.id ? `mun-${this.id}` : "municipality");
    const fallback = ine_trim
      ? `mun-${ine_trim}`
      : (this.id ? `mun-${this.id}` : "municipality");
    this.slug = slugify(base) || slugify(fallback);
  }
}
