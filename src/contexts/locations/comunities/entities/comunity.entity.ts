import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("communities")
export class Comunity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  ogc_fid: number;

  @Column()
  cod_ccaa: string;

  @Column({ nullable: true })
  noml_ccaa: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  cartodb_id: number;

  @Column({
    type: "geometry",
    spatialFeatureType: "MultiPolygon",
    srid: 4326,
  })
  geom: string;
}