import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Relation, UpdateDateColumn } from "typeorm";
import { VehicleEntity } from "./vehicle.entity";


@Entity({ name: "vehicle_videos" })
export class VideosEntity {

  @PrimaryGeneratedColumn("uuid") 
  id: string;

  @Column()
  url:string;

  @Column()
  status:string;

  @CreateDateColumn()
  created_at:Date;

  @UpdateDateColumn()
  updated_at:Date;

  @Column()
  vehicle_id:string;

  @ManyToOne(() => VehicleEntity, (vehicle) => vehicle.videos)
  @JoinColumn({ name: "vehicle_id" })
  vehicle: Relation<VehicleEntity>;
}