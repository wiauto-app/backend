import { Entity, PrimaryGeneratedColumn, Column, Index } from "typeorm";

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

  @Column({ nullable: true })
  cartodb_id: number;

  @Index({ spatial: true })
  @Column({
    type: "geometry",
    spatialFeatureType: "MultiPolygon",
    srid: 4326,
  })
  geom: string;

}