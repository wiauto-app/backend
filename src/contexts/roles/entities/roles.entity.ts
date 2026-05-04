import { Column, CreateDateColumn, DeleteDateColumn, Entity, ManyToMany, OneToMany, PrimaryGeneratedColumn, Relation, UpdateDateColumn } from "typeorm";
import { Profile } from "../../profiles/entities/profile.entity";
import { Permissions } from "../../users/permissions/entities/permissions.entity";

@Entity('roles')
export class Roles {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  is_admin: boolean;

  @Column()
  is_developer: boolean;

  @Column({ default: false })
  is_default: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at?: Date;

  // @Column({ nullable: true })
  // premium_url?: string;  

  @OneToMany(() => Profile, (profile) => profile.role)
  profiles: Relation<Profile[]>;  

  @ManyToMany(() => Permissions, (permissions) => permissions.roles)
  permissions: Relation<Permissions[]>;
}