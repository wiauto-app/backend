import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Relation, UpdateDateColumn } from "typeorm";
import { SessionEntity } from "./session.entity";
import { User } from "../../users/entities/user.entity";

@Entity("refresh_tokens")
export class RefreshTokenEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  user_id: string;

  @Column()
  token_hash: string;

  @Column()
  revoked: boolean;

  @Column()
  expires_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ nullable: true, type: "uuid" })
  parent_id: string | null;

  @Column()
  session_id: string;

  @ManyToOne(() => SessionEntity, (session) => session.refresh_tokens,{
    onDelete: "CASCADE"
  })
  @JoinColumn({ name: "session_id" })
  session: Relation<SessionEntity>;

  @ManyToOne(() => User, (user) => user.refresh_tokens,{
    onDelete: "CASCADE"
  })
  @JoinColumn({ name: "user_id" })
  user: Relation<User>;
}