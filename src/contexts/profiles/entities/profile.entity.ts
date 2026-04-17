import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from "typeorm";
import { User } from "../../users/entities/user.entity";

@Entity()
export class Profile {

  @PrimaryColumn("uuid")
  id!: string;

  @OneToOne(() => User, {
    onDelete: "CASCADE"
  })
  @JoinColumn({ name: "id" })
  user!: User;

  @Column({ nullable: true })
  name?: string;

  @Column({ nullable: true })
  last_name?: string;

  @Column({ nullable: true })
  avatar_url: string;

  @Column({ nullable: true })
  image_url: string


}