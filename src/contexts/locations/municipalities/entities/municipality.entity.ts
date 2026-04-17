import { Entity, PrimaryGeneratedColumn, Column, Index } from "typeorm";

@Entity("municipalities")
export class Municipality {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  ineCode: string;

  @Column({ nullable: true })
  nuts1: string;

  @Column({ nullable: true })
  nuts2: string;

  @Column({ nullable: true })
  nuts3: string;
  
  @Index({ spatial: true })
  @Column({ type: "geometry", spatialFeatureType: "MultiPolygon", srid: 4326 })
  geom: string;
}