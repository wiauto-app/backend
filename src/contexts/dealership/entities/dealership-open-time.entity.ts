import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from "typeorm";

import type { DealershipSchedule } from "./dealership-schedule.entity";

@Entity({ name: "dealership_open_times" })
export class DealershipOpenTime {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  schedule_id: string;

  @Column({ type: "time" })
  open_time: string;

  @Column({ type: "time" })
  close_time: string;

  @ManyToOne("DealershipSchedule", (schedule: DealershipSchedule) => schedule.open_times, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "schedule_id" })
  schedule: Relation<DealershipSchedule>;
}
