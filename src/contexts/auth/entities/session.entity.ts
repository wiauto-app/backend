import { Column, Entity, OneToMany, PrimaryGeneratedColumn, Relation } from "typeorm";
import { CreateDateColumn } from "typeorm";
import { UpdateDateColumn } from "typeorm";
import { RefreshTokenEntity } from "./refresh-token.entity";

@Entity("sessions")
export class SessionEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  user_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column()
  refreshed_at: Date;

  @Column()
  expires_at: Date;

  @Column({ type: "varchar", nullable: true })
  ip_address: string | null;
  
  @Column({ type: "text", nullable: true })
  user_agent: string | null;

  @OneToMany(() => RefreshTokenEntity, (refresh_token) => refresh_token.session)
  refresh_tokens: Relation<RefreshTokenEntity[]>;
}