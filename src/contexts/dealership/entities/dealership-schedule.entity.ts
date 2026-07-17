import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
  Unique,
  UpdateDateColumn,
} from "typeorm";

import type { DealershipEntity } from "./dealership.entity";
import { DealershipOpenTime } from "./dealership-open-time.entity";

@Entity({ name: "dealership_schedules" })
@Unique("UQ_dealership_schedules_dealership_day", ["dealership_id", "day"])
export class DealershipSchedule {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  dealership_id: string;

  @Column({ type: "smallint" })
  day: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => DealershipOpenTime, (open_time) => open_time.schedule, {
    cascade: true,
  })
  open_times: Relation<DealershipOpenTime[]>;

  @ManyToOne("DealershipEntity", (dealership: DealershipEntity) => dealership.schedules, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "dealership_id" })
  dealership: Relation<DealershipEntity>;
}
