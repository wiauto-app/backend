import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn, Relation, UpdateDateColumn } from "typeorm";
import { Roles } from "../../../roles/entities/roles.entity";


@Entity("permissions")
export class Permissions {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column()
  key: string;
  
  @Column({ type: "int", nullable: true })
  value?:number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at?: Date;

  @ManyToMany(() => Roles, (roles) => roles.permissions, { cascade: true })
  @JoinTable({ name: "roles_permissions" })
  roles: Relation<Roles[]>;
}